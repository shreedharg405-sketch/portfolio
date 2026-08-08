-- ==========================================================================
-- STUDENT MANAGEMENT SYSTEM - DATABASE SCHEMA BACKUP (studentms.sql)
-- Target Host: localhost
-- Database Name: studentms
-- ==========================================================================

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------------------------
-- Table Structure for `admins`
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------------------------
-- Table Structure for `students`
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `students` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `roll` VARCHAR(50) NOT NULL,
  `age` INT(11) NOT NULL,
  `dob` DATE NOT NULL,
  `department` VARCHAR(50) NOT NULL,
  `year` INT(11) NOT NULL DEFAULT 1,
  `email` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `gender` VARCHAR(20) NOT NULL,
  `address` TEXT NOT NULL,
  `photo` VARCHAR(255) DEFAULT NULL,
  `father_name` VARCHAR(100) DEFAULT NULL,
  `mother_name` VARCHAR(100) DEFAULT NULL,
  `parent_contact` VARCHAR(20) DEFAULT NULL,
  `id_type` VARCHAR(50) DEFAULT NULL,
  `id_number` VARCHAR(50) DEFAULT NULL,
  `id_doc` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `roll` (`roll`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------------------------
-- Table Structure for `attendance`
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `student_roll` VARCHAR(50) NOT NULL,
  `date` DATE NOT NULL,
  `status` ENUM('Present','Absent') NOT NULL,
  `marked_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_attendance` (`student_roll`,`date`),
  CONSTRAINT `fk_attendance_student` FOREIGN KEY (`student_roll`) REFERENCES `students` (`roll`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS=1;
COMMIT;
