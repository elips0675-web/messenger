-- Миграция: индексы для оптимизации запросов
-- Запуск: mysql -u root corp_messenger < alter-indexes.sql

ALTER TABLE messages ADD INDEX idx_messages_chat_created (chat_id, created_at);
ALTER TABLE notifications ADD INDEX idx_notifications_user_created (user_id, created_at);
ALTER TABLE notifications ADD INDEX idx_notifications_user_readed (user_id, readed);
ALTER TABLE tasks ADD INDEX idx_tasks_assignee_status (assignee_id, status);
ALTER TABLE tasks ADD INDEX idx_tasks_creator_status (creator_id, status);
ALTER TABLE subtasks ADD INDEX idx_subtasks_task_id (task_id);
ALTER TABLE wiki_articles ADD INDEX idx_wiki_articles_category (category_id, status);
ALTER TABLE wiki_articles ADD INDEX idx_wiki_articles_title (title);
ALTER TABLE workflow_requests ADD INDEX idx_workflow_requests_requester_status (requester_id, status);
ALTER TABLE workflow_approvals ADD INDEX idx_workflow_approvals_request (request_id, approver_id);
ALTER TABLE posts ADD INDEX idx_posts_created (created_at);
ALTER TABLE post_comments ADD INDEX idx_post_comments_post (post_id, created_at);
ALTER TABLE course_progress ADD INDEX idx_course_progress_course (course_id, user_id);
ALTER TABLE poll_votes ADD INDEX idx_poll_votes_poll (poll_id, option_id, user_id);
ALTER TABLE users ADD INDEX idx_users_active (is_active);
