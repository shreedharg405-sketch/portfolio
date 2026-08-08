<?php
// api/get_students.php
require_once 'config.php';
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse("error", "Method not allowed. Use GET.", [], 405);
}

$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$department = isset($_GET['department']) ? trim($_GET['department']) : '';
$roll = isset($_GET['roll']) ? trim($_GET['roll']) : '';
$id = isset($_GET['id']) ? trim($_GET['id']) : '';
$year = isset($_GET['year']) ? trim($_GET['year']) : '';

try {
    if (!empty($id) || !empty($roll)) {
        // Fetch single student (e.g., for editing preview or profile view)
        $sql = "SELECT 
                    s.id, s.name, s.roll, s.age, s.dob, s.department, s.year, s.email, s.phone, s.gender, s.address, s.photo,
                    s.father_name, s.mother_name, s.parent_contact, s.id_type, s.id_number, s.id_doc, s.status,
                    COUNT(a.id) as total_days,
                    SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_days,
                    ROUND(IF(COUNT(a.id) > 0, (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 100.0), 1) as attendance_percentage
                FROM students s
                LEFT JOIN attendance a ON s.roll = a.student_roll
                WHERE " . (!empty($id) ? "s.id = ?" : "s.roll = ?") . "
                GROUP BY s.id";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([!empty($id) ? $id : $roll]);
        $student = $stmt->fetch();
        
        if ($student) {
            // Pad ID
            $student['id'] = str_pad($student['id'], 3, "0", STR_PAD_LEFT);
            $student['age'] = intval($student['age']);
            $student['year'] = intval($student['year']);
            $student['attendance_percentage'] = floatval($student['attendance_percentage']);
            sendResponse("success", "Student retrieved.", ["student" => $student]);
        } else {
            sendResponse("error", "Student not found.", [], 404);
        }
    }

    // Build query for multiple students
    $sql = "SELECT 
                s.id, s.name, s.roll, s.age, s.dob, s.department, s.year, s.email, s.phone, s.gender, s.address, s.photo,
                s.father_name, s.mother_name, s.parent_contact, s.id_type, s.id_number, s.id_doc, s.status,
                COUNT(a.id) as total_days,
                SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_days,
                ROUND(IF(COUNT(a.id) > 0, (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 100.0), 1) as attendance_percentage
            FROM students s
            LEFT JOIN attendance a ON s.roll = a.student_roll
            WHERE 1=1";

    $params = [];

    if (!empty($department) && $department !== 'ALL') {
        $sql .= " AND s.department = :department";
        $params['department'] = $department;
    }

    if (!empty($year) && $year !== 'ALL') {
        $sql .= " AND s.year = :year";
        $params['year'] = intval($year);
    }

    if (!empty($search)) {
        $sql .= " AND (s.name LIKE :search OR s.roll LIKE :search OR s.email LIKE :search OR s.phone LIKE :search)";
        $params['search'] = '%' . $search . '%';
    }

    $sql .= " GROUP BY s.id ORDER BY s.id ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $students = $stmt->fetchAll();

    // Pad IDs to 3 digits (e.g. 1 -> 001) for consistency with existing UI
    foreach ($students as &$student) {
        $student['id'] = str_pad($student['id'], 3, "0", STR_PAD_LEFT);
        // Cast numerical fields
        $student['age'] = intval($student['age']);
        $student['year'] = intval($student['year']);
        $student['total_days'] = intval($student['total_days']);
        $student['present_days'] = intval($student['present_days']);
        $student['attendance_percentage'] = floatval($student['attendance_percentage']);
    }

    sendResponse("success", "Students list retrieved.", ["students" => $students]);

} catch (PDOException $e) {
    sendResponse("error", "Database error: " . $e->getMessage(), [], 500);
}
?>
