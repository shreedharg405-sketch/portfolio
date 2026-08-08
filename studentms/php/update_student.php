<?php
// api/update_student.php
require_once 'config.php';
requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse("error", "Method not allowed. Use POST.", [], 405);
}

$original_roll = isset($_POST['original_roll']) ? trim($_POST['original_roll']) : '';
$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$roll = isset($_POST['roll']) ? trim($_POST['roll']) : '';
$age = isset($_POST['age']) ? intval($_POST['age']) : 0;
$dob = isset($_POST['dob']) ? trim($_POST['dob']) : '';
$department = isset($_POST['department']) ? trim($_POST['department']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$gender = isset($_POST['gender']) ? trim($_POST['gender']) : '';
$address = isset($_POST['address']) ? trim($_POST['address']) : '';

// Optional ERP Fields
$father_name = isset($_POST['father_name']) ? trim($_POST['father_name']) : '';
$mother_name = isset($_POST['mother_name']) ? trim($_POST['mother_name']) : '';
$parent_contact = isset($_POST['parent_contact']) ? trim($_POST['parent_contact']) : '';
$id_type = isset($_POST['id_type']) ? trim($_POST['id_type']) : '';
$id_number = isset($_POST['id_number']) ? trim($_POST['id_number']) : '';

// Validation checks - ONLY Name and Roll Number are compulsory
if (empty($original_roll) || empty($name) || empty($roll)) {
    sendResponse("error", "Name and Roll/Registration Number are compulsory.", [], 400);
}

if (strlen($name) < 2) {
    sendResponse("error", "Name must be at least 2 characters.", [], 400);
}

if (!preg_match('/^[a-zA-Z0-9-]{3,20}$/', $roll)) {
    sendResponse("error", "Roll number must be 3-20 alphanumeric characters.", [], 400);
}

// Sensible fallbacks for optional fields if omitted
if (empty($email)) {
    $email = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $roll)) . '@student.com';
}
if ($age <= 0) {
    $age = 18;
}
if (empty($dob)) {
    $dob = '2000-01-01';
}
if (empty($department)) {
    $department = 'General';
}
if (empty($gender)) {
    $gender = 'Other';
}
if (empty($address)) {
    $address = 'N/A';
}

try {
    // Verify target student exists
    $stmtExist = $pdo->prepare("SELECT photo, id_doc FROM students WHERE roll = ?");
    $stmtExist->execute([$original_roll]);
    $currentStudent = $stmtExist->fetch();
    if (!$currentStudent) {
        sendResponse("error", "Student record not found.", [], 404);
    }

    // Check duplicate roll number if changing roll number
    if (strtolower($original_roll) !== strtolower($roll)) {
        $stmtRoll = $pdo->prepare("SELECT id FROM students WHERE LOWER(roll) = LOWER(?)");
        $stmtRoll->execute([$roll]);
        if ($stmtRoll->fetch()) {
            sendResponse("error", "Conflict: New roll number already exists.", [], 409);
        }
    }

    // Check duplicate email
    $stmtEmail = $pdo->prepare("SELECT id FROM students WHERE LOWER(email) = LOWER(?) AND LOWER(roll) != LOWER(?)");
    $stmtEmail->execute([$email, $original_roll]);
    if ($stmtEmail->fetch()) {
        sendResponse("error", "Conflict: Email already exists for another student.", [], 409);
    }

    $uploadDir = '../uploads/students/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Handle photo upload
    $photoPath = $currentStudent['photo'];
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['photo']['tmp_name'];
        $fileName = $_FILES['photo']['name'];
        $fileSize = $_FILES['photo']['size'];
        
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $allowedExtensions = ['png', 'jpg', 'jpeg', 'gif'];
        
        if (!in_array($fileExtension, $allowedExtensions)) {
            sendResponse("error", "Invalid photo format. Only PNG, JPG, JPEG, and GIF are allowed.", [], 400);
        }
        
        if ($fileSize > 5 * 1024 * 1024) {
            sendResponse("error", "Photo size exceeds the limit of 5MB.", [], 400);
        }
        
        $newFileName = time() . '_' . uniqid() . '.' . $fileExtension;
        $destPath = $uploadDir . $newFileName;
        
        if (move_uploaded_file($fileTmpPath, $destPath)) {
            if (!empty($currentStudent['photo']) && file_exists('../' . $currentStudent['photo'])) {
                @unlink('../' . $currentStudent['photo']);
            }
            $photoPath = 'uploads/students/' . $newFileName;
        } else {
            sendResponse("error", "Failed to save uploaded photo file.", [], 500);
        }
    }

    // Handle ID Document upload
    $idDocPath = $currentStudent['id_doc'];
    if (isset($_FILES['id_doc']) && $_FILES['id_doc']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['id_doc']['tmp_name'];
        $fileName = $_FILES['id_doc']['name'];
        $fileSize = $_FILES['id_doc']['size'];
        
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $allowedExtensions = ['png', 'jpg', 'jpeg', 'pdf', 'docx'];
        
        if (!in_array($fileExtension, $allowedExtensions)) {
            sendResponse("error", "Invalid document format. Only PDF, PNG, JPG, JPEG, and DOCX are allowed.", [], 400);
        }
        
        if ($fileSize > 5 * 1024 * 1024) {
            sendResponse("error", "Document size exceeds the limit of 5MB.", [], 400);
        }
        
        $newFileName = 'doc_' . time() . '_' . uniqid() . '.' . $fileExtension;
        $destPath = $uploadDir . $newFileName;
        
        if (move_uploaded_file($fileTmpPath, $destPath)) {
            if (!empty($currentStudent['id_doc']) && file_exists('../' . $currentStudent['id_doc'])) {
                @unlink('../' . $currentStudent['id_doc']);
            }
            $idDocPath = 'uploads/students/' . $newFileName;
        } else {
            sendResponse("error", "Failed to save uploaded document file.", [], 500);
        }
    }

    // Update statement
    $stmtUpdate = $pdo->prepare("UPDATE students SET name = ?, roll = ?, age = ?, dob = ?, department = ?, email = ?, phone = ?, gender = ?, address = ?, photo = ?, father_name = ?, mother_name = ?, parent_contact = ?, id_type = ?, id_number = ?, id_doc = ? WHERE roll = ?");
    $stmtUpdate->execute([$name, $roll, $age, $dob, $department, $email, $phone, $gender, $address, $photoPath, $father_name, $mother_name, $parent_contact, $id_type, $id_number, $idDocPath, $original_roll]);

    sendResponse("success", "Student record updated successfully.", [
        "student" => [
            "name" => $name,
            "roll" => $roll,
            "photo" => $photoPath
        ]
    ]);

} catch (PDOException $e) {
    sendResponse("error", "Database error: " . $e->getMessage(), [], 500);
}
?>
