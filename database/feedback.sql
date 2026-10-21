USE learning_path_db;

CREATE TABLE IF NOT EXISTS resource_feedback (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  resource_id BIGINT NOT NULL,
  value INT NOT NULL,
  UNIQUE (user_id, resource_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
);
