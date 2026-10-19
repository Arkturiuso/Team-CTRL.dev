CREATE DATABASE  IF NOT EXISTS `robocode` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `robocode`;
-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: robocode
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account_status`
--

DROP TABLE IF EXISTS `account_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_status` (
  `account_status_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`account_status_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_status`
--

LOCK TABLES `account_status` WRITE;
/*!40000 ALTER TABLE `account_status` DISABLE KEYS */;
INSERT INTO `account_status` VALUES (1,'active'),(2,'blocked');
/*!40000 ALTER TABLE `account_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_user`
--

DROP TABLE IF EXISTS `app_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_user` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `login` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registration` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `account_status_id` int NOT NULL,
  `role` enum('player','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'player',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `login` (`login`),
  KEY `fk_user_account_status` (`account_status_id`),
  CONSTRAINT `fk_user_account_status` FOREIGN KEY (`account_status_id`) REFERENCES `account_status` (`account_status_id`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_user`
--

LOCK TABLES `app_user` WRITE;
/*!40000 ALTER TABLE `app_user` DISABLE KEYS */;
INSERT INTO `app_user` VALUES (1,'admin','admin123','2026-10-05 09:11:00',1,'admin'),(2,'player1','player123','2026-10-05 09:11:00',1,'player'),(3,'player2','player456','2026-10-05 09:11:00',1,'player'),(4,'dmitry_volkov','V0lkov!2024','2026-08-12 09:14:00',1,'player'),(5,'anna_smirnova','Sm!rn0va#88','2026-08-13 11:02:00',1,'player'),(6,'sergey_kozlov','K0zl0v$77','2026-08-14 13:47:00',1,'player'),(7,'elena_popova','P0p0va_2024','2026-08-15 08:30:00',1,'player'),(8,'andrey_novikov','N0v1k0v!15','2026-08-16 16:25:00',1,'player'),(9,'maria_ivanova','1van0va_maria','2026-08-17 10:10:00',1,'player'),(10,'pavel_morozov','M0r0z0v#pavel','2026-08-18 12:55:00',1,'player'),(11,'olga_sokolova','S0k0l0va!olga','2026-08-19 14:38:00',1,'player'),(12,'ivan_petrov','P3tr0v_ivan','2026-08-20 09:05:00',1,'player'),(13,'natalya_lebedeva','L3b3d3va_nat','2026-08-21 15:22:00',1,'player'),(14,'alexey_orlov','0rl0v_alexey','2026-08-22 11:47:00',1,'player'),(15,'tatyana_zhukova','Zhuk0va_tat','2026-08-23 08:19:00',1,'player'),(16,'mikhail_vlasov','Vlas0v_mikhail','2026-08-24 17:03:00',1,'player'),(17,'irina_belova','Bel0va_irina','2026-08-25 13:36:00',1,'player'),(18,'nikolay_gusev','Gus3v_nikolay','2026-08-26 10:44:00',1,'player'),(19,'svetlana_fedorova','F3d0r0va_svet','2026-08-27 12:28:00',1,'player'),(20,'artem_kiselev','K1s3l3v_artem','2026-08-28 09:51:00',1,'player'),(21,'yulia_komarova','K0mar0va_yul','2026-08-29 16:14:00',1,'player'),(22,'denis_titov','T1t0v_denis','2026-08-30 11:20:00',1,'player'),(23,'alina_kuznetsova','Kuzn3ts0va_al','2026-08-31 14:07:00',1,'player'),(24,'vladimir_egorov','3g0r0v_vlad','2026-09-01 08:42:00',1,'player'),(25,'ekaterina_pavlova','Pavl0va_ekat','2026-09-02 10:33:00',1,'player'),(26,'roman_semenov','S3m3n0v_roman','2026-09-03 12:18:00',1,'player'),(27,'daria_golubeva','G0lub3va_dar','2026-09-04 15:49:00',1,'player'),(28,'maxim_vinogradov','V1n0grad0v_max','2026-09-05 09:27:00',1,'player'),(29,'ksenia_bogdanova','B0gdan0va_ks','2026-09-06 11:56:00',1,'player'),(30,'igor_karpov','Karp0v_igor','2026-09-07 14:11:00',1,'player'),(31,'vera_afanasyeva','Afanasy3va_v','2026-09-08 08:05:00',1,'player'),(32,'oleg_danilov','Dan1l0v_oleg','2026-09-09 16:37:00',1,'player'),(33,'polina_ershkova','3rshk0va_pol','2026-09-10 10:22:00',1,'player'),(34,'stanislav_kruglov','Krugl0v_stan','2026-09-11 13:44:00',1,'player'),(35,'lyudmila_tihonova','T1h0n0va_lyud','2026-09-12 09:18:00',2,'player'),(36,'gleb_shubin','Shub1n_gleb','2026-09-13 12:31:00',1,'player'),(37,'viktoria_merkush','M3rkush_vikt','2026-09-14 15:09:00',1,'player'),(38,'fedor_polyakov','P0lyak0v_fed','2026-09-15 08:53:00',1,'player'),(39,'zoya_rogova','R0g0va_zoya','2026-09-16 11:40:00',1,'player'),(40,'vasily_kalinin','Kal1n1n_vas','2026-09-17 14:27:00',1,'player'),(41,'nina_lebedeva','L3b3d3va_nina','2026-09-18 10:15:00',1,'player'),(42,'konstantin_mironov','M1r0n0v_kost','2026-09-19 13:02:00',1,'player'),(43,'lidia_zakharova','Zakhar0va_lid','2026-09-20 16:48:00',1,'player'),(44,'anatoly_bobrov','B0br0v_anat','2026-09-21 09:36:00',1,'player'),(45,'galina_kotova','K0t0va_gal','2026-09-22 12:21:00',2,'player'),(46,'timur_nikitin','N1k1t1n_timur','2026-09-23 15:54:00',1,'player'),(47,'alisa_krylova','Kryl0va_alisa','2026-09-24 08:47:00',1,'player'),(48,'boris_savelev','Sav3l3v_boris','2026-09-25 11:12:00',1,'player'),(49,'marina_ilina','1l1na_marina','2026-09-26 14:39:00',1,'player'),(50,'egor_soloviev','S0l0v3v_egor','2026-09-27 10:26:00',1,'player'),(51,'anna_makarova','Makar0va_anna','2026-09-28 13:13:00',1,'player'),(52,'kirill_baranov','Baran0v_kirill','2026-09-29 16:58:00',1,'player'),(53,'alexandra_zueva','Zu3va_alex','2026-09-30 09:41:00',1,'player');
/*!40000 ALTER TABLE `app_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attempt`
--

DROP TABLE IF EXISTS `attempt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attempt` (
  `attempt_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `level_id` int NOT NULL,
  `source_code` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `submitted` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `attempt_status_id` int NOT NULL,
  `tick_count` int DEFAULT NULL,
  `lines_count` int DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`attempt_id`),
  KEY `fk_attempt_user` (`user_id`),
  KEY `fk_attempt_level` (`level_id`),
  KEY `fk_attempt_status` (`attempt_status_id`),
  CONSTRAINT `fk_attempt_level` FOREIGN KEY (`level_id`) REFERENCES `level` (`level_id`),
  CONSTRAINT `fk_attempt_status` FOREIGN KEY (`attempt_status_id`) REFERENCES `attempt_status` (`attempt_status_id`),
  CONSTRAINT `fk_attempt_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=130 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attempt`
--

LOCK TABLES `attempt` WRITE;
/*!40000 ALTER TABLE `attempt` DISABLE KEYS */;
INSERT INTO `attempt` VALUES (1,2,1,'move_right()\nmove_down()\nmove_right()\nmove_down()\nmove_up()\nmove_right()','2026-09-01 10:15:00',2,42,6,NULL),(2,3,1,'move_right()\nmove_down()\nmove_right()\nmove_down()\nmove_up()\nmove_right()','2026-09-02 12:20:00',2,44,6,NULL),(3,4,2,'move_right()\nmove_down()','2026-09-03 09:10:00',3,8,2,'Столкновение со стеной на позиции B2'),(4,4,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-03 09:12:00',2,18,5,NULL),(5,4,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-03 10:00:00',2,26,6,NULL),(6,4,4,'move_down()\nmove_right()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()','2026-09-04 11:30:00',2,33,7,NULL),(7,4,5,'move_right()\nmove_down()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()\nmove_right()','2026-09-05 14:00:00',2,40,8,NULL),(8,4,6,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-06 15:20:00',2,48,9,NULL),(9,4,7,'move_right()\nmove_down()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()\nmove_right()\nmove_up()\nmove_right()','2026-09-07 16:40:00',2,56,10,NULL),(10,4,8,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()\nmove_right()\nmove_down()\nmove_right()\nmove_up()\nmove_right()\nmove_down()','2026-09-08 17:50:00',2,64,11,NULL),(11,4,9,'move_right()\nmove_down()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()\nmove_right()\nmove_up()\nmove_right()\nmove_down()\nmove_right()','2026-09-09 18:10:00',2,72,12,NULL),(12,4,10,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()\nmove_right()\nmove_down()\nmove_right()\nmove_up()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-10 19:30:00',2,82,13,NULL),(13,5,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-04 09:20:00',2,19,5,NULL),(14,5,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-04 10:10:00',2,27,6,NULL),(15,5,4,'move_down()\nmove_right()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()','2026-09-05 11:00:00',2,34,7,NULL),(16,5,5,'move_right()\nmove_down()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()\nmove_right()','2026-09-06 12:30:00',2,41,8,NULL),(17,5,6,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-07 13:40:00',2,49,9,NULL),(18,5,7,'move_right()\nmove_down()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()\nmove_right()\nmove_up()\nmove_right()','2026-09-08 14:50:00',2,57,10,NULL),(19,5,8,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()\nmove_right()\nmove_down()\nmove_right()\nmove_up()\nmove_right()\nmove_down()','2026-09-09 15:00:00',2,65,11,NULL),(20,5,9,'move_right()\nmove_down()','2026-09-10 16:10:00',1,5,2,NULL),(21,6,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-05 08:30:00',2,20,5,NULL),(22,6,3,'move_right()\nmove_down()\nmove_right()','2026-09-05 09:00:00',3,6,3,'Не собран ключ 1 на позиции B2'),(23,6,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()','2026-09-05 09:05:00',3,20,5,'Не собран ключ 2 на позиции E4'),(24,6,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-05 09:12:00',2,29,6,NULL),(25,6,4,'move_down()\nmove_right()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()','2026-09-06 10:00:00',2,35,7,NULL),(26,7,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-06 07:50:00',2,21,5,NULL),(27,7,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-06 08:40:00',2,30,6,NULL),(28,7,4,'move_down()\nmove_right()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()','2026-09-07 09:30:00',2,36,7,NULL),(29,8,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-07 10:20:00',2,22,5,NULL),(30,8,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-07 11:10:00',2,31,6,NULL),(31,8,4,'move_down()\nmove_right()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()','2026-09-08 12:00:00',2,37,7,NULL),(32,8,5,'move_right()\nmove_down()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()\nmove_right()','2026-09-09 13:00:00',2,42,8,NULL),(33,9,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-08 08:15:00',2,23,5,NULL),(34,9,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-08 09:05:00',2,32,6,NULL),(35,9,4,'move_down()\nmove_right()\nmove_right()','2026-09-09 10:00:00',3,6,3,'Столкновение со стеной на D3'),(36,9,4,'move_down()\nmove_right()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()','2026-09-09 10:08:00',2,38,7,NULL),(37,10,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-09 11:45:00',2,24,5,NULL),(38,10,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-09 12:35:00',2,33,6,NULL),(39,11,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-10 13:25:00',2,25,5,NULL),(40,11,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-10 14:15:00',2,34,6,NULL),(41,11,4,'move_down()\nmove_right()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()','2026-09-11 15:05:00',2,39,7,NULL),(42,11,5,'move_right()\nmove_down()','2026-09-12 16:00:00',3,5,2,'Не собран ключ 1 на позиции B3'),(43,12,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-11 07:55:00',2,20,5,NULL),(44,12,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-11 08:45:00',2,28,6,NULL),(45,12,4,'move_down()\nmove_right()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()','2026-09-12 09:35:00',2,35,7,NULL),(46,12,5,'move_right()\nmove_down()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()\nmove_right()','2026-09-13 10:25:00',2,43,8,NULL),(47,12,6,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-14 11:15:00',2,50,9,NULL),(48,13,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-12 12:05:00',2,26,5,NULL),(49,13,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-12 12:55:00',2,35,6,NULL),(50,14,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-13 08:40:00',2,27,5,NULL),(51,14,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-13 09:30:00',2,36,6,NULL),(52,14,4,'move_down()\nmove_right()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()','2026-09-14 10:20:00',2,40,7,NULL),(53,15,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-14 11:10:00',2,28,5,NULL),(54,15,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-14 12:00:00',2,37,6,NULL),(55,16,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-15 13:00:00',2,21,5,NULL),(56,16,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-15 13:50:00',2,29,6,NULL),(57,16,4,'move_down()\nmove_right()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()','2026-09-16 14:40:00',2,36,7,NULL),(58,16,5,'move_right()\nmove_down()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()\nmove_right()','2026-09-17 15:30:00',2,44,8,NULL),(59,17,2,'move_down()\nmove_right()','2026-09-16 16:20:00',3,4,2,'Столкновение со стеной на B2'),(60,17,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-16 16:28:00',2,29,5,NULL),(61,18,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-17 07:40:00',2,22,5,NULL),(62,18,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-17 08:30:00',2,30,6,NULL),(63,18,4,'move_down()\nmove_right()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()','2026-09-18 09:20:00',2,37,7,NULL),(64,19,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-18 10:10:00',2,23,5,NULL),(65,19,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-18 11:00:00',2,31,6,NULL),(66,20,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-19 12:00:00',2,20,5,NULL),(67,20,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-19 12:50:00',2,28,6,NULL),(68,20,4,'move_down()\nmove_right()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()','2026-09-20 13:40:00',2,35,7,NULL),(69,20,5,'move_right()\nmove_down()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()\nmove_right()','2026-09-21 14:30:00',2,43,8,NULL),(70,20,6,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-22 15:20:00',2,51,9,NULL),(71,21,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-20 08:30:00',2,24,5,NULL),(72,21,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-20 09:20:00',2,32,6,NULL),(73,22,2,'move_down()','2026-09-21 10:10:00',3,2,1,'Не собран ключ 1 на позиции C3'),(74,22,2,'move_down()\nmove_right()\nmove_down()','2026-09-21 10:18:00',3,6,3,'Столкновение со стеной на B4'),(75,22,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-21 10:30:00',2,30,5,NULL),(76,23,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-22 11:20:00',2,25,5,NULL),(77,23,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-22 12:10:00',2,33,6,NULL),(78,23,4,'move_down()\nmove_right()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()','2026-09-23 13:00:00',2,38,7,NULL),(79,24,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-23 14:00:00',2,26,5,NULL),(80,24,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-23 14:50:00',2,34,6,NULL),(81,25,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-24 15:40:00',2,27,5,NULL),(82,25,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-24 16:30:00',2,35,6,NULL),(83,25,4,'move_down()\nmove_right()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()','2026-09-25 17:20:00',2,39,7,NULL),(84,26,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-25 08:10:00',2,21,5,NULL),(85,26,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-25 09:00:00',2,29,6,NULL),(86,26,4,'move_down()\nmove_right()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()','2026-09-26 10:00:00',2,36,7,NULL),(87,26,5,'move_right()\nmove_down()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()\nmove_right()','2026-09-27 11:00:00',2,44,8,NULL),(88,27,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-26 12:00:00',2,28,5,NULL),(89,27,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-26 12:50:00',2,36,6,NULL),(90,28,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-27 13:40:00',2,20,5,NULL),(91,28,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-27 14:30:00',2,28,6,NULL),(92,28,4,'move_down()\nmove_right()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()','2026-09-28 15:20:00',2,35,7,NULL),(93,28,5,'move_right()\nmove_down()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()\nmove_right()','2026-09-29 16:10:00',2,43,8,NULL),(94,29,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-28 17:00:00',2,30,5,NULL),(95,29,3,'move_right()\nmove_down()','2026-09-29 18:00:00',3,4,2,'Не собран ключ 2 на позиции E4'),(96,30,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-29 07:50:00',2,23,5,NULL),(97,30,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-29 08:40:00',2,31,6,NULL),(98,31,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-30 09:30:00',2,24,5,NULL),(99,31,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-09-30 10:20:00',2,32,6,NULL),(100,31,4,'move_down()\nmove_right()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()','2026-10-01 11:10:00',2,37,7,NULL),(101,32,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-10-01 12:00:00',2,25,5,NULL),(102,32,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-10-01 12:50:00',2,33,6,NULL),(103,33,2,'move_down()','2026-10-02 13:40:00',3,2,1,'Столкновение со стеной на B2'),(104,33,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-10-02 13:48:00',2,31,5,NULL),(105,34,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-10-03 14:40:00',2,22,5,NULL),(106,34,3,'move_right()\nmove_down()\nmove_down()\nmove_right()\nmove_up()\nmove_up()','2026-10-03 15:30:00',2,30,6,NULL),(107,34,4,'move_down()\nmove_right()\nmove_right()\nmove_down()\nmove_up()\nmove_right()\nmove_down()','2026-10-04 16:20:00',2,37,7,NULL),(108,35,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-09-14 17:10:00',2,32,5,NULL),(109,36,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-10-04 08:30:00',2,33,5,NULL),(110,37,2,'move_down()\nmove_right()','2026-10-04 09:20:00',3,3,2,'Не собран ключ 1 на позиции C3'),(111,37,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-10-04 09:30:00',2,34,5,NULL),(112,38,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-10-05 10:20:00',2,35,5,NULL),(113,39,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-10-05 11:10:00',2,36,5,NULL),(114,40,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-10-05 12:00:00',2,37,5,NULL),(115,41,2,'move_down()\nmove_right()','2026-10-05 13:00:00',3,3,2,'Столкновение со стеной на B4'),(116,42,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-10-05 14:00:00',2,38,5,NULL),(117,43,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-10-05 15:00:00',2,39,5,NULL),(118,44,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-10-05 16:00:00',2,40,5,NULL),(119,45,2,'move_down()','2026-10-05 17:00:00',3,1,1,'Не собран ключ 1 на позиции C3'),(120,46,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-10-05 18:00:00',2,41,5,NULL),(121,47,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-10-05 19:00:00',2,42,5,NULL),(122,48,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-10-05 20:00:00',2,43,5,NULL),(123,49,2,'move_down()','2026-10-05 21:00:00',3,1,1,'Не собран ключ 1 на позиции C3'),(124,49,2,'move_down()\nmove_right()\nmove_down()','2026-10-05 21:08:00',3,5,3,'Столкновение со стеной на B4'),(125,49,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-10-05 21:15:00',2,44,5,NULL),(126,50,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-10-05 22:00:00',2,45,5,NULL),(127,51,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-10-05 23:00:00',2,46,5,NULL),(128,52,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-10-06 00:00:00',2,47,5,NULL),(129,53,2,'move_down()\nmove_right()\nmove_down()\nmove_right()\nmove_up()','2026-10-06 01:00:00',2,48,5,NULL);
/*!40000 ALTER TABLE `attempt` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attempt_status`
--

DROP TABLE IF EXISTS `attempt_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attempt_status` (
  `attempt_status_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`attempt_status_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attempt_status`
--

LOCK TABLES `attempt_status` WRITE;
/*!40000 ALTER TABLE `attempt_status` DISABLE KEYS */;
INSERT INTO `attempt_status` VALUES (3,'error'),(1,'in_progress'),(2,'success');
/*!40000 ALTER TABLE `attempt_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `command`
--

DROP TABLE IF EXISTS `command`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `command` (
  `command_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `syntax` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`command_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `command`
--

LOCK TABLES `command` WRITE;
/*!40000 ALTER TABLE `command` DISABLE KEYS */;
INSERT INTO `command` VALUES (1,'move_up','move_up()','Движение робота на одну клетку вверх по карте'),(2,'move_down','move_down()','Движение робота на одну клетку вниз по карте'),(3,'move_left','move_left()','Движение робота на одну клетку влево по карте'),(4,'move_right','move_right()','Движение робота на одну клетку вправо по карте');
/*!40000 ALTER TABLE `command` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `difficulty`
--

DROP TABLE IF EXISTS `difficulty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `difficulty` (
  `difficulty_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`difficulty_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `difficulty`
--

LOCK TABLES `difficulty` WRITE;
/*!40000 ALTER TABLE `difficulty` DISABLE KEYS */;
INSERT INTO `difficulty` VALUES (1,'easy'),(4,'expert'),(3,'hard'),(2,'medium');
/*!40000 ALTER TABLE `difficulty` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `knowledge_base`
--

DROP TABLE IF EXISTS `knowledge_base`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knowledge_base` (
  `user_id` int NOT NULL,
  `command_id` int NOT NULL,
  PRIMARY KEY (`user_id`,`command_id`),
  KEY `fk_kb_command` (`command_id`),
  CONSTRAINT `fk_kb_command` FOREIGN KEY (`command_id`) REFERENCES `command` (`command_id`),
  CONSTRAINT `fk_kb_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `knowledge_base`
--

LOCK TABLES `knowledge_base` WRITE;
/*!40000 ALTER TABLE `knowledge_base` DISABLE KEYS */;
/*!40000 ALTER TABLE `knowledge_base` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leaderboard`
--

DROP TABLE IF EXISTS `leaderboard`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leaderboard` (
  `position` int NOT NULL,
  `user_id` int NOT NULL,
  `login` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_score` int NOT NULL DEFAULT '0',
  `updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`position`),
  UNIQUE KEY `uq_leaderboard_user` (`user_id`),
  CONSTRAINT `fk_leaderboard_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leaderboard`
--

LOCK TABLES `leaderboard` WRITE;
/*!40000 ALTER TABLE `leaderboard` DISABLE KEYS */;
INSERT INTO `leaderboard` VALUES (1,4,'dmitry_volkov',3700,'2026-10-19 09:09:05'),(2,5,'anna_smirnova',2445,'2026-10-19 09:09:05'),(3,12,'ivan_petrov',1375,'2026-10-19 09:09:05'),(4,20,'artem_kiselev',1370,'2026-10-19 09:09:05'),(5,28,'maxim_vinogradov',995,'2026-10-19 09:09:05'),(6,16,'mikhail_vlasov',975,'2026-10-19 09:09:05'),(7,26,'roman_semenov',975,'2026-10-19 09:09:05'),(8,8,'andrey_novikov',965,'2026-10-19 09:09:05'),(9,6,'sergey_kozlov',625,'2026-10-19 09:09:05'),(10,7,'elena_popova',610,'2026-10-19 09:09:05'),(11,18,'nikolay_gusev',600,'2026-10-19 09:09:05'),(12,34,'stanislav_kruglov',600,'2026-10-19 09:09:05'),(13,9,'maria_ivanova',580,'2026-10-19 09:09:05'),(14,31,'vera_afanasyeva',580,'2026-10-19 09:09:05'),(15,23,'alina_kuznetsova',565,'2026-10-19 09:09:05'),(16,11,'olga_sokolova',555,'2026-10-19 09:09:05'),(17,25,'ekaterina_pavlova',540,'2026-10-19 09:09:05'),(18,14,'alexey_orlov',530,'2026-10-19 09:09:05'),(19,19,'svetlana_fedorova',340,'2026-10-19 09:09:05'),(20,30,'igor_karpov',340,'2026-10-19 09:09:05'),(21,21,'yulia_komarova',330,'2026-10-19 09:09:05'),(22,10,'pavel_morozov',325,'2026-10-19 09:09:05'),(23,32,'oleg_danilov',320,'2026-10-19 09:09:05'),(24,24,'vladimir_egorov',310,'2026-10-19 09:09:05'),(25,13,'natalya_lebedeva',305,'2026-10-19 09:09:05'),(26,27,'daria_golubeva',290,'2026-10-19 09:09:05'),(27,15,'tatyana_zhukova',285,'2026-10-19 09:09:05'),(28,17,'irina_belova',75,'2026-10-19 09:09:05'),(29,22,'denis_titov',70,'2026-10-19 09:09:05'),(30,29,'ksenia_bogdanova',70,'2026-10-19 09:09:05'),(31,33,'polina_ershkova',65,'2026-10-19 09:09:05'),(32,35,'lyudmila_tihonova',60,'2026-10-19 09:09:05'),(33,36,'gleb_shubin',55,'2026-10-19 09:09:05'),(34,37,'viktoria_merkush',50,'2026-10-19 09:09:05'),(35,38,'fedor_polyakov',45,'2026-10-19 09:09:05'),(36,39,'zoya_rogova',40,'2026-10-19 09:09:05'),(37,40,'vasily_kalinin',35,'2026-10-19 09:09:05'),(38,42,'konstantin_mironov',30,'2026-10-19 09:09:05'),(39,43,'lidia_zakharova',25,'2026-10-19 09:09:05'),(40,44,'anatoly_bobrov',20,'2026-10-19 09:09:05'),(41,46,'timur_nikitin',15,'2026-10-19 09:09:05'),(42,47,'alisa_krylova',10,'2026-10-19 09:09:05'),(43,48,'boris_savelev',5,'2026-10-19 09:09:05');
/*!40000 ALTER TABLE `leaderboard` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `level`
--

DROP TABLE IF EXISTS `level`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `level` (
  `level_id` int NOT NULL AUTO_INCREMENT,
  `map_data` json NOT NULL,
  `difficulty_id` int NOT NULL,
  `level_status_id` int NOT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`level_id`),
  KEY `fk_level_difficulty` (`difficulty_id`),
  KEY `fk_level_status` (`level_status_id`),
  CONSTRAINT `fk_level_difficulty` FOREIGN KEY (`difficulty_id`) REFERENCES `difficulty` (`difficulty_id`),
  CONSTRAINT `fk_level_status` FOREIGN KEY (`level_status_id`) REFERENCES `level_status` (`level_status_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `level`
--

LOCK TABLES `level` WRITE;
/*!40000 ALTER TABLE `level` DISABLE KEYS */;
INSERT INTO `level` VALUES (1,'{\"exit\": \"I9\", \"keys\": [{\"id\": 1, \"position\": \"B2\"}, {\"id\": 2, \"position\": \"E5\"}, {\"id\": 3, \"position\": \"H8\"}], \"walls\": [{\"id\": 1, \"side1\": \"A1-A3\", \"side2\": \"B1-B3\"}, {\"id\": 2, \"side1\": \"D1-D4\", \"side2\": \"E1-E4\"}, {\"id\": 3, \"side1\": \"B5-B7\", \"side2\": \"C5-C7\"}, {\"id\": 4, \"side1\": \"F3-F6\", \"side2\": \"F4-F6\"}, {\"id\": 5, \"side1\": \"H2-H4\", \"side2\": \"I2-I4\"}], \"width\": 9, \"height\": 9, \"entrance\": \"A1\", \"keys_count\": 3, \"level_name\": \"Лабиринт забытого храма\", \"description\": \"Древний храм с запутанными коридорами\"}',2,1,'2026-10-05 09:11:00'),(2,'{\"exit\": \"E5\", \"keys\": [{\"id\": 1, \"position\": \"C3\"}], \"walls\": [{\"id\": 1, \"side1\": \"B2-B4\", \"side2\": \"C2-C4\"}], \"width\": 5, \"height\": 5, \"entrance\": \"A1\", \"keys_count\": 1, \"level_name\": \"Первый шаг\", \"description\": \"Простой коридор с одним ключом\"}',1,1,'2026-09-01 10:00:00'),(3,'{\"exit\": \"F6\", \"keys\": [{\"id\": 1, \"position\": \"B2\"}, {\"id\": 2, \"position\": \"E4\"}], \"walls\": [{\"id\": 1, \"side1\": \"A3-C3\", \"side2\": \"A4-C4\"}, {\"id\": 2, \"side1\": \"D2-D5\", \"side2\": \"E2-E5\"}], \"width\": 6, \"height\": 6, \"entrance\": \"A1\", \"keys_count\": 2, \"level_name\": \"Двойной поворот\", \"description\": \"Два ключа и два поворота\"}',1,1,'2026-09-03 11:30:00'),(4,'{\"exit\": \"G7\", \"keys\": [{\"id\": 1, \"position\": \"C2\"}, {\"id\": 2, \"position\": \"F5\"}], \"walls\": [{\"id\": 1, \"side1\": \"B1-B3\", \"side2\": \"C1-C3\"}, {\"id\": 2, \"side1\": \"E4-E6\", \"side2\": \"F4-F6\"}, {\"id\": 3, \"side1\": \"D2-D4\", \"side2\": \"D3-D5\"}], \"width\": 7, \"height\": 7, \"entrance\": \"A1\", \"keys_count\": 2, \"level_name\": \"Каменный лабиринт\", \"description\": \"Классический лабиринт среднего размера\"}',2,1,'2026-09-06 14:15:00'),(5,'{\"exit\": \"H8\", \"keys\": [{\"id\": 1, \"position\": \"B3\"}, {\"id\": 2, \"position\": \"E2\"}, {\"id\": 3, \"position\": \"G6\"}], \"walls\": [{\"id\": 1, \"side1\": \"A2-C2\", \"side2\": \"A3-C3\"}, {\"id\": 2, \"side1\": \"D1-D3\", \"side2\": \"E1-E3\"}, {\"id\": 3, \"side1\": \"F4-F7\", \"side2\": \"G4-G7\"}], \"width\": 8, \"height\": 8, \"entrance\": \"A1\", \"keys_count\": 3, \"level_name\": \"Три ключа\", \"description\": \"Три ключа, три препятствия\"}',2,1,'2026-09-09 09:45:00'),(6,'{\"exit\": \"I9\", \"keys\": [{\"id\": 1, \"position\": \"C2\"}, {\"id\": 2, \"position\": \"F4\"}, {\"id\": 3, \"position\": \"H7\"}], \"walls\": [{\"id\": 1, \"side1\": \"B2-B5\", \"side2\": \"C2-C5\"}, {\"id\": 2, \"side1\": \"E3-E6\", \"side2\": \"F3-F6\"}, {\"id\": 3, \"side1\": \"G1-G3\", \"side2\": \"H1-H3\"}], \"width\": 9, \"height\": 9, \"entrance\": \"A1\", \"keys_count\": 3, \"level_name\": \"Забытые катакомбы\", \"description\": \"Большой лабиринт с тремя ключами\"}',3,1,'2026-09-12 16:20:00'),(7,'{\"exit\": \"J10\", \"keys\": [{\"id\": 1, \"position\": \"B4\"}, {\"id\": 2, \"position\": \"E1\"}, {\"id\": 3, \"position\": \"H8\"}, {\"id\": 4, \"position\": \"I5\"}], \"walls\": [{\"id\": 1, \"side1\": \"A3-C3\", \"side2\": \"A4-C4\"}, {\"id\": 2, \"side1\": \"D2-D6\", \"side2\": \"E2-E6\"}, {\"id\": 3, \"side1\": \"G5-G7\", \"side2\": \"H5-H7\"}], \"width\": 10, \"height\": 10, \"entrance\": \"A1\", \"keys_count\": 4, \"level_name\": \"Четыре стихии\", \"description\": \"Четыре ключа в большом зале\"}',3,1,'2026-09-15 12:00:00'),(8,'{\"exit\": \"K11\", \"keys\": [{\"id\": 1, \"position\": \"C3\"}, {\"id\": 2, \"position\": \"F6\"}, {\"id\": 3, \"position\": \"I2\"}, {\"id\": 4, \"position\": \"J9\"}], \"walls\": [{\"id\": 1, \"side1\": \"B2-B6\", \"side2\": \"C2-C6\"}, {\"id\": 2, \"side1\": \"E4-E8\", \"side2\": \"F4-F8\"}, {\"id\": 3, \"side1\": \"H1-H5\", \"side2\": \"I1-I5\"}, {\"id\": 4, \"side1\": \"G7-G10\", \"side2\": \"H7-H10\"}], \"width\": 11, \"height\": 11, \"entrance\": \"A1\", \"keys_count\": 4, \"level_name\": \"Проклятый склеп\", \"description\": \"Сложный лабиринт с четырьмя ключами\"}',3,1,'2026-09-18 18:30:00'),(9,'{\"exit\": \"L12\", \"keys\": [{\"id\": 1, \"position\": \"B2\"}, {\"id\": 2, \"position\": \"E5\"}, {\"id\": 3, \"position\": \"H3\"}, {\"id\": 4, \"position\": \"K9\"}], \"walls\": [{\"id\": 1, \"side1\": \"A4-C4\", \"side2\": \"A5-C5\"}, {\"id\": 2, \"side1\": \"D1-D7\", \"side2\": \"E1-E7\"}, {\"id\": 3, \"side1\": \"G6-G9\", \"side2\": \"H6-H9\"}, {\"id\": 4, \"side1\": \"J2-J5\", \"side2\": \"K2-K5\"}, {\"id\": 5, \"side1\": \"F8-F11\", \"side2\": \"G8-G11\"}], \"width\": 12, \"height\": 12, \"entrance\": \"A1\", \"keys_count\": 4, \"level_name\": \"Пещера дракона\", \"description\": \"Экспертный уровень, лабиринт с пятью стенами\"}',4,1,'2026-09-22 20:00:00'),(10,'{\"exit\": \"M13\", \"keys\": [{\"id\": 1, \"position\": \"C4\"}, {\"id\": 2, \"position\": \"F2\"}, {\"id\": 3, \"position\": \"I7\"}, {\"id\": 4, \"position\": \"L4\"}, {\"id\": 5, \"position\": \"M10\"}], \"walls\": [{\"id\": 1, \"side1\": \"B3-B7\", \"side2\": \"C3-C7\"}, {\"id\": 2, \"side1\": \"E1-E5\", \"side2\": \"F1-F5\"}, {\"id\": 3, \"side1\": \"H6-H10\", \"side2\": \"I6-I10\"}, {\"id\": 4, \"side1\": \"K2-K6\", \"side2\": \"L2-L6\"}, {\"id\": 5, \"side1\": \"D9-D12\", \"side2\": \"E9-E12\"}, {\"id\": 6, \"side1\": \"G3-G8\", \"side2\": \"H3-H8\"}], \"width\": 13, \"height\": 13, \"entrance\": \"A1\", \"keys_count\": 5, \"level_name\": \"Сердце лабиринта\", \"description\": \"Финальный экспертный уровень, пять ключей\"}',4,1,'2026-09-25 21:15:00');
/*!40000 ALTER TABLE `level` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `level_status`
--

DROP TABLE IF EXISTS `level_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `level_status` (
  `level_status_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`level_status_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `level_status`
--

LOCK TABLES `level_status` WRITE;
/*!40000 ALTER TABLE `level_status` DISABLE KEYS */;
INSERT INTO `level_status` VALUES (1,'available'),(2,'blocked'),(3,'hidden');
/*!40000 ALTER TABLE `level_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `player_statistics`
--

DROP TABLE IF EXISTS `player_statistics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player_statistics` (
  `user_id` int NOT NULL,
  `total_score` int NOT NULL DEFAULT '0',
  `levels_passed` int NOT NULL DEFAULT '0',
  `last_update` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_stats_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `player_statistics`
--

LOCK TABLES `player_statistics` WRITE;
/*!40000 ALTER TABLE `player_statistics` DISABLE KEYS */;
INSERT INTO `player_statistics` VALUES (2,0,0,'2026-10-05 09:11:00'),(3,0,0,'2026-10-05 09:11:00'),(4,3700,9,'2026-09-10 19:30:00'),(5,2445,7,'2026-09-09 15:00:00'),(6,625,3,'2026-09-06 10:00:00'),(7,610,3,'2026-09-07 09:30:00'),(8,965,4,'2026-09-09 13:00:00'),(9,580,3,'2026-09-09 10:08:00'),(10,325,2,'2026-09-09 12:35:00'),(11,555,3,'2026-09-11 15:05:00'),(12,1375,5,'2026-09-14 11:15:00'),(13,305,2,'2026-09-12 12:55:00'),(14,530,3,'2026-09-14 10:20:00'),(15,285,2,'2026-09-14 12:00:00'),(16,975,4,'2026-09-17 15:30:00'),(17,75,1,'2026-09-16 16:28:00'),(18,600,3,'2026-09-18 09:20:00'),(19,340,2,'2026-09-18 11:00:00'),(20,1370,5,'2026-09-22 15:20:00'),(21,330,2,'2026-09-20 09:20:00'),(22,70,1,'2026-09-21 10:30:00'),(23,565,3,'2026-09-23 13:00:00'),(24,310,2,'2026-09-23 14:50:00'),(25,540,3,'2026-09-25 17:20:00'),(26,975,4,'2026-09-27 11:00:00'),(27,290,2,'2026-09-26 12:50:00'),(28,995,4,'2026-09-29 16:10:00'),(29,70,1,'2026-09-28 17:00:00'),(30,340,2,'2026-09-29 08:40:00'),(31,580,3,'2026-10-01 11:10:00'),(32,320,2,'2026-10-01 12:50:00'),(33,65,1,'2026-10-02 13:48:00'),(34,600,3,'2026-10-04 16:20:00'),(35,60,1,'2026-09-14 17:10:00'),(36,55,1,'2026-10-04 08:30:00'),(37,50,1,'2026-10-04 09:30:00'),(38,45,1,'2026-10-05 10:20:00'),(39,40,1,'2026-10-05 11:10:00'),(40,35,1,'2026-10-05 12:00:00'),(42,30,1,'2026-10-05 14:00:00'),(43,25,1,'2026-10-05 15:00:00'),(44,20,1,'2026-10-05 16:00:00'),(46,15,1,'2026-10-05 18:00:00'),(47,10,1,'2026-10-05 19:00:00'),(48,5,1,'2026-10-05 20:00:00'),(49,0,1,'2026-10-05 21:15:00'),(50,0,1,'2026-10-05 22:00:00'),(51,0,1,'2026-10-05 23:00:00'),(52,0,1,'2026-10-06 00:00:00'),(53,0,1,'2026-10-06 01:00:00');
/*!40000 ALTER TABLE `player_statistics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_token`
--

DROP TABLE IF EXISTS `refresh_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_token` (
  `refresh_token_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token_hash` char(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`refresh_token_id`),
  UNIQUE KEY `uq_refresh_token_hash` (`token_hash`),
  KEY `idx_refresh_user` (`user_id`),
  KEY `idx_refresh_expires` (`expires_at`),
  CONSTRAINT `fk_refresh_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_token`
--

LOCK TABLES `refresh_token` WRITE;
/*!40000 ALTER TABLE `refresh_token` DISABLE KEYS */;
INSERT INTO `refresh_token` VALUES (1,4,'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90','2026-11-10 09:12:00',0),(2,5,'b2c3d4e5f6a718293a4b5c6d7e8f90a1b2c3d4e5f6a718293a4b5c6d7e8f90a1','2026-11-10 10:00:00',0),(3,12,'c3d4e5f6a7b819293a4b5c6d7e8f90a1b2c3d4e5f6a7b819293a4b5c6d7e8f90','2026-11-14 11:15:00',0),(4,20,'d4e5f6a7b8c919293a4b5c6d7e8f90a1b2c3d4e5f6a7b8c919293a4b5c6d7e8f','2026-11-22 15:20:00',0),(5,26,'e5f6a7b8c9da19293a4b5c6d7e8f90a1b2c3d4e5f6a7b8c9da19293a4b5c6d7e','2026-11-27 11:00:00',0),(6,28,'f6a7b8c9daeb19293a4b5c6d7e8f90a1b2c3d4e5f6a7b8c9daeb19293a4b5c6d','2026-11-29 16:10:00',0),(7,4,'a7b8c9daebfc19293a4b5c6d7e8f90a1b2c3d4e5f6a7b8c9daebfc19293a4b5c','2026-11-30 19:30:00',1),(8,6,'b8c9daebfc0d19293a4b5c6d7e8f90a1b2c3d4e5f6a7b8c9daebfc0d19293a4b','2026-12-06 10:00:00',0);
/*!40000 ALTER TABLE `refresh_token` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `result`
--

DROP TABLE IF EXISTS `result`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `result` (
  `user_id` int NOT NULL,
  `level_id` int NOT NULL,
  `tick_count` int NOT NULL,
  `keys_collected` int NOT NULL DEFAULT '0',
  `total_score` int NOT NULL DEFAULT '0',
  `fixed` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `attempt_id` int DEFAULT NULL,
  PRIMARY KEY (`user_id`,`level_id`),
  KEY `fk_result_level` (`level_id`),
  KEY `fk_result_attempt` (`attempt_id`),
  CONSTRAINT `fk_result_attempt` FOREIGN KEY (`attempt_id`) REFERENCES `attempt` (`attempt_id`),
  CONSTRAINT `fk_result_level` FOREIGN KEY (`level_id`) REFERENCES `level` (`level_id`),
  CONSTRAINT `fk_result_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `result`
--

LOCK TABLES `result` WRITE;
/*!40000 ALTER TABLE `result` DISABLE KEYS */;
INSERT INTO `result` VALUES (2,1,42,3,420,'2026-09-01 10:15:00',1),(3,1,44,3,410,'2026-09-02 12:20:00',2),(4,2,18,1,130,'2026-09-03 09:12:00',4),(4,3,26,2,260,'2026-09-03 10:00:00',5),(4,4,33,2,270,'2026-09-04 11:30:00',6),(4,5,40,3,380,'2026-09-05 14:00:00',7),(4,6,48,3,390,'2026-09-06 15:20:00',8),(4,7,56,4,520,'2026-09-07 16:40:00',9),(4,8,64,4,530,'2026-09-08 17:50:00',10),(4,9,72,4,540,'2026-09-09 18:10:00',11),(4,10,82,5,680,'2026-09-10 19:30:00',12),(5,2,19,1,125,'2026-09-04 09:20:00',13),(5,3,27,2,255,'2026-09-04 10:10:00',14),(5,4,34,2,265,'2026-09-05 11:00:00',15),(5,5,41,3,375,'2026-09-06 12:30:00',16),(5,6,49,3,385,'2026-09-07 13:40:00',17),(5,7,57,4,515,'2026-09-08 14:50:00',18),(5,8,65,4,525,'2026-09-09 15:00:00',19),(6,2,20,1,120,'2026-09-05 08:30:00',21),(6,3,29,2,245,'2026-09-05 09:12:00',24),(6,4,35,2,260,'2026-09-06 10:00:00',25),(7,2,21,1,115,'2026-09-06 07:50:00',26),(7,3,30,2,240,'2026-09-06 08:40:00',27),(7,4,36,2,255,'2026-09-07 09:30:00',28),(8,2,22,1,110,'2026-09-07 10:20:00',29),(8,3,31,2,235,'2026-09-07 11:10:00',30),(8,4,37,2,250,'2026-09-08 12:00:00',31),(8,5,42,3,370,'2026-09-09 13:00:00',32),(9,2,23,1,105,'2026-09-08 08:15:00',33),(9,3,32,2,230,'2026-09-08 09:05:00',34),(9,4,38,2,245,'2026-09-09 10:08:00',36),(10,2,24,1,100,'2026-09-09 11:45:00',37),(10,3,33,2,225,'2026-09-09 12:35:00',38),(11,2,25,1,95,'2026-09-10 13:25:00',39),(11,3,34,2,220,'2026-09-10 14:15:00',40),(11,4,39,2,240,'2026-09-11 15:05:00',41),(12,2,20,1,120,'2026-09-11 07:55:00',43),(12,3,28,2,250,'2026-09-11 08:45:00',44),(12,4,35,2,260,'2026-09-12 09:35:00',45),(12,5,43,3,365,'2026-09-13 10:25:00',46),(12,6,50,3,380,'2026-09-14 11:15:00',47),(13,2,26,1,90,'2026-09-12 12:05:00',48),(13,3,35,2,215,'2026-09-12 12:55:00',49),(14,2,27,1,85,'2026-09-13 08:40:00',50),(14,3,36,2,210,'2026-09-13 09:30:00',51),(14,4,40,2,235,'2026-09-14 10:20:00',52),(15,2,28,1,80,'2026-09-14 11:10:00',53),(15,3,37,2,205,'2026-09-14 12:00:00',54),(16,2,21,1,115,'2026-09-15 13:00:00',55),(16,3,29,2,245,'2026-09-15 13:50:00',56),(16,4,36,2,255,'2026-09-16 14:40:00',57),(16,5,44,3,360,'2026-09-17 15:30:00',58),(17,2,29,1,75,'2026-09-16 16:28:00',60),(18,2,22,1,110,'2026-09-17 07:40:00',61),(18,3,30,2,240,'2026-09-17 08:30:00',62),(18,4,37,2,250,'2026-09-18 09:20:00',63),(19,2,23,1,105,'2026-09-18 10:10:00',64),(19,3,31,2,235,'2026-09-18 11:00:00',65),(20,2,20,1,120,'2026-09-19 12:00:00',66),(20,3,28,2,250,'2026-09-19 12:50:00',67),(20,4,35,2,260,'2026-09-20 13:40:00',68),(20,5,43,3,365,'2026-09-21 14:30:00',69),(20,6,51,3,375,'2026-09-22 15:20:00',70),(21,2,24,1,100,'2026-09-20 08:30:00',71),(21,3,32,2,230,'2026-09-20 09:20:00',72),(22,2,30,1,70,'2026-09-21 10:30:00',75),(23,2,25,1,95,'2026-09-22 11:20:00',76),(23,3,33,2,225,'2026-09-22 12:10:00',77),(23,4,38,2,245,'2026-09-23 13:00:00',78),(24,2,26,1,90,'2026-09-23 14:00:00',79),(24,3,34,2,220,'2026-09-23 14:50:00',80),(25,2,27,1,85,'2026-09-24 15:40:00',81),(25,3,35,2,215,'2026-09-24 16:30:00',82),(25,4,39,2,240,'2026-09-25 17:20:00',83),(26,2,21,1,115,'2026-09-25 08:10:00',84),(26,3,29,2,245,'2026-09-25 09:00:00',85),(26,4,36,2,255,'2026-09-26 10:00:00',86),(26,5,44,3,360,'2026-09-27 11:00:00',87),(27,2,28,1,80,'2026-09-26 12:00:00',88),(27,3,36,2,210,'2026-09-26 12:50:00',89),(28,2,20,1,120,'2026-09-27 13:40:00',90),(28,3,28,2,250,'2026-09-27 14:30:00',91),(28,4,35,2,260,'2026-09-28 15:20:00',92),(28,5,43,3,365,'2026-09-29 16:10:00',93),(29,2,30,1,70,'2026-09-28 17:00:00',94),(30,2,23,1,105,'2026-09-29 07:50:00',96),(30,3,31,2,235,'2026-09-29 08:40:00',97),(31,2,24,1,100,'2026-09-30 09:30:00',98),(31,3,32,2,230,'2026-09-30 10:20:00',99),(31,4,37,2,250,'2026-10-01 11:10:00',100),(32,2,25,1,95,'2026-10-01 12:00:00',101),(32,3,33,2,225,'2026-10-01 12:50:00',102),(33,2,31,1,65,'2026-10-02 13:48:00',104),(34,2,22,1,110,'2026-10-03 14:40:00',105),(34,3,30,2,240,'2026-10-03 15:30:00',106),(34,4,37,2,250,'2026-10-04 16:20:00',107),(35,2,32,1,60,'2026-09-14 17:10:00',108),(36,2,33,1,55,'2026-10-04 08:30:00',109),(37,2,34,1,50,'2026-10-04 09:30:00',111),(38,2,35,1,45,'2026-10-05 10:20:00',112),(39,2,36,1,40,'2026-10-05 11:10:00',113),(40,2,37,1,35,'2026-10-05 12:00:00',114),(42,2,38,1,30,'2026-10-05 14:00:00',116),(43,2,39,1,25,'2026-10-05 15:00:00',117),(44,2,40,1,20,'2026-10-05 16:00:00',118),(46,2,41,1,15,'2026-10-05 18:00:00',120),(47,2,42,1,10,'2026-10-05 19:00:00',121),(48,2,43,1,5,'2026-10-05 20:00:00',122),(49,2,44,1,0,'2026-10-05 21:15:00',125),(50,2,45,1,0,'2026-10-05 22:00:00',126),(51,2,46,1,0,'2026-10-05 23:00:00',127),(52,2,47,1,0,'2026-10-06 00:00:00',128),(53,2,48,1,0,'2026-10-06 01:00:00',129);
/*!40000 ALTER TABLE `result` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-19  9:14:30
