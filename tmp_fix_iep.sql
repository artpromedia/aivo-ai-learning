DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'iep_parse_status') THEN
    CREATE TYPE iep_parse_status AS ENUM('PENDING', 'PARSING', 'PARSED', 'CONFIRMED', 'FAILED', 'PENDING_TEACHER_UPLOAD');
  END IF;
END $$;

DROP TABLE IF EXISTS iep_documents CASCADE;

CREATE TABLE iep_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  learner_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  file_url varchar(2048) NOT NULL,
  file_type varchar(64) NOT NULL,
  parsed_data jsonb DEFAULT '{}'::jsonb,
  parse_status iep_parse_status DEFAULT 'PENDING' NOT NULL,
  confirmed_by uuid,
  confirmed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX iep_documents_learner_id_idx ON iep_documents USING btree (learner_id);
ALTER TABLE iep_documents ADD CONSTRAINT iep_documents_learner_id_learners_id_fk FOREIGN KEY (learner_id) REFERENCES learners(id) ON DELETE CASCADE;
ALTER TABLE iep_documents ADD CONSTRAINT iep_documents_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE iep_documents ADD CONSTRAINT iep_documents_confirmed_by_users_id_fk FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL;
