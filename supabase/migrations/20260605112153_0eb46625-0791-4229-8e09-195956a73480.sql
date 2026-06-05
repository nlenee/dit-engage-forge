
CREATE OR REPLACE FUNCTION public.submit_public_application(_payload jsonb)
RETURNS TABLE(id uuid, reference_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_app_id uuid;
  new_ref text;
  resp jsonb;
  doc jsonb;
  selected_faction text;
BEGIN
  selected_faction := NULLIF(_payload->>'selected_faction','');

  INSERT INTO public.applications (
    application_type, applicant_email, applicant_name,
    applicant_user_id, selected_faction, ref_campaign, link_slug,
    about_yourself, why_join_dit, referred_by_user_id, referred_faction
  ) VALUES (
    COALESCE((_payload->>'application_type')::application_type, 'membership'::application_type),
    LOWER(TRIM(_payload->>'applicant_email')),
    TRIM(_payload->>'applicant_name'),
    NULLIF(_payload->>'applicant_user_id','')::uuid,
    selected_faction,
    NULLIF(_payload->>'ref_campaign',''),
    NULLIF(_payload->>'link_slug',''),
    NULLIF(_payload->>'about_yourself',''),
    NULLIF(_payload->>'why_join_dit',''),
    NULLIF(_payload->>'referred_by_user_id','')::uuid,
    COALESCE(NULLIF(_payload->>'referred_faction',''), selected_faction)
  )
  RETURNING applications.id, applications.reference_number INTO new_app_id, new_ref;

  IF jsonb_typeof(_payload->'responses') = 'array' THEN
    FOR resp IN SELECT * FROM jsonb_array_elements(_payload->'responses')
    LOOP
      INSERT INTO public.application_responses (application_id, section, question_key, question_text, response_value)
      VALUES (
        new_app_id,
        COALESCE(resp->>'section','general'),
        resp->>'question_key',
        resp->>'question_text',
        resp->'response_value'
      );
    END LOOP;
  END IF;

  IF jsonb_typeof(_payload->'documents') = 'array' THEN
    FOR doc IN SELECT * FROM jsonb_array_elements(_payload->'documents')
    LOOP
      INSERT INTO public.application_documents (application_id, document_type, storage_path, file_name)
      VALUES (
        new_app_id,
        (doc->>'document_type')::document_type,
        doc->>'storage_path',
        COALESCE(doc->>'file_name', doc->>'document_type')
      );
    END LOOP;
  END IF;

  RETURN QUERY SELECT new_app_id, new_ref;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_public_application(jsonb) TO anon, authenticated;
