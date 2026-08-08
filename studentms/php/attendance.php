<?php
// api/attendance.php
require_once 'config.php';
requireAdmin();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $date = isset($_GET['date']) ? trim($_GET['date']) : '';
    $department = isset($_GET['department']) ? trim($_GET['department']) : '';
    if (empty($date)) {
        $date = date('Y-m-d');
    }

    try {
        $sql = "
            SELECT 
                s.id, s.name, s.roll, s.department, s.photo,
                a.status
            FROM students s
            LEFT JOIN attendance a ON s.roll = a.student_roll AND a.date = ?
        ";
        $params = [$date];

        if (!empty($department) && $department !== 'ALL') {
            $sql .= " WHERE s.department = ?";
            $params[] = $department;
        }

        $sql .= " ORDER BY s.id ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $records = $stmt->fetchAll();

        foreach ($records as &$rec) {
            $rec['id'] = str_pad($rec['id'], 3, "0", STR_PAD_LEFT);
        }

        // Check if there is actual attendance saved for today
        $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM attendance WHERE date = ?");
        $stmtCheck->execute([$date]);
        $isMarked = $stmtCheck->fetchColumn() > 0;

        sendResponse("success", "Attendance records retrieved.", [
            "date" => $date,
            "department" => $department,
            "is_marked" => $isMarked,
            "records" => $records
        ]);

    } catch (PDOException $e) {
        sendResponse("error", "Database error: " . $e->getMessage(), [], 500);
    }

} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $date = isset($input['date']) ? trim($input['date']) : '';
    $records = isset($input['records']) ? $input['records'] : [];

    if (empty($date)) {
        sendResponse("error", "Date is required.", [], 400);
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("
            INSERT INTO attendance (student_roll, date, status) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE status = VALUES(status)
        ");

        foreach ($records as $roll => $status) {
            if ($status !== 'Present' && $status !== 'Absent') {
                $status = 'Present';
            }
            $stmt->execute([$roll, $date, $status]);
        }

        $pdo->commit();
        sendResponse("success", "Attendance for $date saved successfully.");

    } catch (PDOException $e) {
        $pdo->rollBack();
        sendResponse("error", "Database error: " . $e->getMessage(), [], 500);
    }
} else {
    sendResponse("error", "Method not allowed.", [], 405);
}
?>
