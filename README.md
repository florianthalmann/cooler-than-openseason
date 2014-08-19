USER TABLE

1. Create a MySQL database and add the following table:

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(32) COLLATE utf8_unicode_ci NOT NULL,
  `email` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `passphrase` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `salt` varchar(64) COLLATE utf8_unicode_ci NOT NULL,
  `token` varchar(32) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci AUTO_INCREMENT=10 ;


2. Open the file 'php/config.php' and enter your database details

3. Flush cache/reload app