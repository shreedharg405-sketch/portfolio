<?php
// api/export_students.php
require_once 'config.php';
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse("error", "Method not allowed. Use GET.", [], 405);
}

try {
    // Disable JSON response headers from config.php since we're exporting a file
    header_remove("Content-Type");
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=student_registry_' . date('Y-m-d') . '.csv');

    // Create file pointer connected to output stream
    $output = fopen('php://output', 'w');

    // Add CSV column headers
    fputcsv($output, ['ID', 'Name', 'Roll Number', 'Age', 'Date of Birth', 'Department', 'Email', 'Phone', 'Gender', 'Address', 'Attendance Percentage (%)']);

    // Fetch student data with attendance calculation
    $stmt = $pdo->query("
        SELECT 
            s.id, s.name, s.roll, s.age, s.dob, s.department, s.email, s.phone, s.gender, s.address,
            ROUND(IF(COUNT(a.id) > 0, (SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 100.0), 1) as attendance_percentage
        FROM students s
        LEFT JOIN attendance a ON s.roll = a.student_roll
        GROUP BY s.id
        ORDER BY s.id ASC
    ");

    while ($row = $stmt->fetch()) {
        $row['id'] = str_pad($row['id'], 3, "0", STR_PAD_LEFT);
        
        fputcsv($output, [
            $row['id'],
            $row['name'],
            $row['roll'],
            $row['age'],
            $row['dob'],
            $row['department'],
            $row['email'],
            $row['phone'],
            $row['gender'],
            $row['address'],
            $row['attendance_percentage']
        ]);
    }

    fclose($output);
    exit();

} catch (PDOException $e) {
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Database error during export: " . $e->getMessage()
    ]);
    exit();
}
?>
