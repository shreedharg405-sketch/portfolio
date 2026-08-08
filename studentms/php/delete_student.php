<?php
// api/delete_student.php
require_once 'config.php';
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse("error", "Method not allowed. Use POST.", [], 405);
}

// Get POST input data (support both JSON and raw POST)
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$roll = isset($input['roll']) ? trim($input['roll']) : '';

if (empty($roll)) {
    sendResponse("error", "Roll number is required for deletion.", [], 400);
}

try {
    // Check if student exists and retrieve photo path
    $stmtSelect = $pdo->prepare("SELECT photo, name FROM students WHERE roll = ?");
    $stmtSelect->execute([$roll]);
    $student = $stmtSelect->fetch();

    if (!$student) {
        sendResponse("error", "Student record not found.", [], 404);
    }

    // Delete photo file if it exists
    if (!empty($student['photo']) && file_exists('../' . $student['photo'])) {
        @unlink('../' . $student['photo']);
    }

    // Delete student record (cascades to attendance)
    $stmtDelete = $pdo->prepare("DELETE FROM students WHERE roll = ?");
    $stmtDelete->execute([$roll]);

    sendResponse("success", "Student record deleted successfully.", [
        "deleted_roll" => $roll,
        "student_name" => $student['name']
    ]);

} catch (PDOException $e) {
    sendResponse("error", "Database error: " . $e->getMessage(), [], 500);
}
?>
