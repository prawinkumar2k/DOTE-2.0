-- Run once if upload for docType=marksheetQualifying returns 500 (Unknown column).
ALTER TABLE student_master
  ADD COLUMN qualifying_marksheet_certificate VARCHAR(512) NULL;
