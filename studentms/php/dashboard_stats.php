<?php
// api/dashboard_stats.php
require_once 'config.php';
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse("error", "Method not allowed. Use GET.", [], 405);
}

try {
    $today = date('Y-m-d');

    // 1. Total Students
    $stmtTotal = $pdo->query("SELECT COUNT(*) FROM students");
    $totalStudents = intval($stmtTotal->fetchColumn());

    // 2. Average Age
    $stmtAge = $pdo->query("SELECT IFNULL(ROUND(AVG(age), 1), 0) FROM students");
    $avgAge = floatval($stmtAge->fetchColumn());

    // 3. Latest Student ID
    $stmtLatest = $pdo->query("SELECT id FROM students ORDER BY id DESC LIMIT 1");
    $latestIdRaw = $stmtLatest->fetchColumn();
    $latestId = $latestIdRaw ? '#' . str_pad($latestIdRaw, 3, "0", STR_PAD_LEFT) : '-';

    // 4. Department Counts
    $stmtDept = $pdo->query("SELECT department, COUNT(*) as count FROM students GROUP BY department ORDER BY department ASC");
    $deptCounts = $stmtDept->fetchAll();
    
    $departmentCounts = [];
    foreach ($deptCounts as $row) {
        $departmentCounts[$row['department']] = intval($row['count']);
    }
    $totalDepartments = count($departmentCounts);

    // 5. Today's Attendance Stats
    $stmtAttMarked = $pdo->prepare("SELECT COUNT(*) FROM attendance WHERE date = ?");
    $stmtAttMarked->execute([$today]);
    $attendanceMarked = $stmtAttMarked->fetchColumn() > 0;

    $presentToday = 0;
    $absentToday = 0;
    if ($attendanceMarked) {
        $stmtPres = $pdo->prepare("SELECT COUNT(*) FROM attendance WHERE date = ? AND status = 'Present'");
        $stmtPres->execute([$today]);
        $presentToday = intval($stmtPres->fetchColumn());

        $stmtAbs = $pdo->prepare("SELECT COUNT(*) FROM attendance WHERE date = ? AND status = 'Absent'");
        $stmtAbs->execute([$today]);
        $absentToday = intval($stmtAbs->fetchColumn());
    }

    // 6. Recent Students (Max 4)
    $stmtRecent = $pdo->query("SELECT id, name, roll, department, email, phone, photo FROM students ORDER BY id DESC LIMIT 4");
    $recentStudents = $stmtRecent->fetchAll();
    foreach ($recentStudents as &$student) {
        $student['id'] = str_pad($student['id'], 3, "0", STR_PAD_LEFT);
    }

    // Gender breakdown for analytics page
    $stmtGender = $pdo->query("SELECT gender, COUNT(*) as count FROM students GROUP BY gender");
    $genderRows = $stmtGender->fetchAll();
    $genderCounts = ["Male" => 0, "Female" => 0, "Other" => 0];
    foreach ($genderRows as $row) {
        $g = $row['gender'];
        if (isset($genderCounts[$g])) {
            $genderCounts[$g] = intval($row['count']);
        } else {
            $genderCounts["Other"] += intval($row['count']);
        }
    }

    // Department-wise student lists
    $stmtDeptStuds = $pdo->query("SELECT id, name, roll, department, photo, email FROM students ORDER BY department ASC, name ASC");
    $deptStudRows = $stmtDeptStuds->fetchAll();
    $departmentStudents = [];
    foreach ($deptStudRows as $sRow) {
        $sRow['id'] = str_pad($sRow['id'], 3, "0", STR_PAD_LEFT);
        $dept = $sRow['department'];
        if (!isset($departmentStudents[$dept])) {
            $departmentStudents[$dept] = [];
        }
        $departmentStudents[$dept][] = $sRow;
    }

    sendResponse("success", "Dashboard statistics retrieved.", [
        "total_students" => $totalStudents,
        "avg_age" => $avgAge,
        "latest_id" => $latestId,
        "total_departments" => $totalDepartments,
        "department_counts" => $departmentCounts,
        "department_students" => $departmentStudents,
        "attendance_marked" => $attendanceMarked,
        "present_today" => $presentToday,
        "absent_today" => $absentToday,
        "recent_students" => $recentStudents,
        "gender_counts" => $genderCounts
    ]);

} catch (PDOException $e) {
    sendResponse("error", "Database error: " . $e->getMessage(), [], 500);
}
?>
