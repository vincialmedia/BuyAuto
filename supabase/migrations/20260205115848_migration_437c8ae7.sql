create or replace function public.apply_canonical_vehicle_ids_listings()
returns trigger
language plpgsql
as $$
declare
  v_row jsonb;
  v_make_id uuid;
  v_model_id uuid;
  v_variant_id uuid;

  v_brand_text text;
  v_model_text text;
  v_variant_text text;

  v_model_from_variant uuid;
  v_make_from_model uuid;
begin
  v_row := to_jsonb(new);

  v_make_id := new.make_id;
  v_model_id := new.model_id;
  v_variant_id := new.variant_id;

  v_brand_text := nullif(trim(new.brand), '');
  v_model_text := nullif(trim(new.model), '');

  v_variant_text := nullif(
    trim(
      coalesce(
        v_row->>'variant',
        v_row->>'trim',
        v_row->>'version',
        v_row->>'derivative'
      )
    ),
    ''
  );

  -- Derive chain from already-set IDs (does not overwrite)
  if v_model_id is null and v_variant_id is not null then
    begin
      select v.model_id into v_model_from_variant
      from public.variants v
      where v.id = v_variant_id
      limit 1;
    exception when others then
      v_model_from_variant := null;
    end;

    if v_model_from_variant is not null then
      v_model_id := v_model_from_variant;
      new.model_id := v_model_from_variant;
    end if;
  end if;

  if v_make_id is null and v_model_id is not null then
    begin
      select m.make_id into v_make_from_model
      from public.models m
      where m.id = v_model_id
      limit 1;
    exception when others then
      v_make_from_model := null;
    end;

    if v_make_from_model is not null then
      v_make_id := v_make_from_model;
      new.make_id := v_make_from_model;
    end if;
  end if;

  -- Resolve make_id from brand (only if still NULL)
  if v_make_id is null and v_brand_text is not null then
    begin
      v_make_id := public.resolve_make_id(v_brand_text);
    exception when others then
      v_make_id := null;
    end;

    if v_make_id is not null then
      new.make_id := v_make_id;
    end if;
  end if;

  -- Resolve model_id from model text (only if still NULL, and make known)
  if v_model_id is null and v_model_text is not null then
    v_make_id := coalesce(v_make_id, new.make_id);

    if v_make_id is not null then
      begin
        v_model_id := public.resolve_model_id(v_make_id, v_model_text);
      exception when others then
        v_model_id := null;
      end;

      if v_model_id is not null then
        new.model_id := v_model_id;
      end if;
    end if;
  end if;

  -- Resolve variant_id (only if still NULL, and model known, and variant text exists)
  if v_variant_id is null and v_variant_text is not null then
    v_model_id := coalesce(v_model_id, new.model_id);

    if v_model_id is not null then
      begin
        v_variant_id := public.resolve_variant_id(v_model_id, v_variant_text);
      exception when others then
        v_variant_id := null;
      end;

      if v_variant_id is not null then
        new.variant_id := v_variant_id;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_00_apply_canonical_vehicle_ids on public.listings;
create trigger trg_00_apply_canonical_vehicle_ids
before insert or update on public.listings
for each row
execute function public.apply_canonical_vehicle_ids_listings();


create or replace function public.apply_canonical_vehicle_ids_listing_drafts()
returns trigger
language plpgsql
as $$
declare
  v_make_id uuid;
  v_model_id uuid;
  v_variant_id uuid;

  v_brand_text text;
  v_model_text text;
  v_variant_text text;

  v_model_from_variant uuid;
  v_make_from_model uuid;
begin
  v_make_id := new.make_id;
  v_model_id := new.model_id;
  v_variant_id := new.variant_id;

  v_brand_text := nullif(
    trim(
      coalesce(
        new.data->>'brand',
        new.data->>'make',
        new.data->>'manufacturer'
      )
    ),
    ''
  );

  v_model_text := nullif(
    trim(
      coalesce(
        new.data->>'model',
        new.data->>'model_name',
        new.data->>'modelName'
      )
    ),
    ''
  );

  v_variant_text := nullif(
    trim(
      coalesce(
        new.data->>'variant',
        new.data->>'trim',
        new.data->>'version',
        new.data->>'derivative'
      )
    ),
    ''
  );

  -- Derive chain from already-set IDs (does not overwrite)
  if v_model_id is null and v_variant_id is not null then
    begin
      select v.model_id into v_model_from_variant
      from public.variants v
      where v.id = v_variant_id
      limit 1;
    exception when others then
      v_model_from_variant := null;
    end;

    if v_model_from_variant is not null then
      v_model_id := v_model_from_variant;
      new.model_id := v_model_from_variant;
    end if;
  end if;

  if v_make_id is null and v_model_id is not null then
    begin
      select m.make_id into v_make_from_model
      from public.models m
      where m.id = v_model_id
      limit 1;
    exception when others then
      v_make_from_model := null;
    end;

    if v_make_from_model is not null then
      v_make_id := v_make_from_model;
      new.make_id := v_make_from_model;
    end if;
  end if;

  -- Resolve make_id from draft data (only if still NULL)
  if v_make_id is null and v_brand_text is not null then
    begin
      v_make_id := public.resolve_make_id(v_brand_text);
    exception when others then
      v_make_id := null;
    end;

    if v_make_id is not null then
      new.make_id := v_make_id;
    end if;
  end if;

  -- Resolve model_id from draft data (only if still NULL, and make known)
  if v_model_id is null and v_model_text is not null then
    v_make_id := coalesce(v_make_id, new.make_id);

    if v_make_id is not null then
      begin
        v_model_id := public.resolve_model_id(v_make_id, v_model_text);
      exception when others then
        v_model_id := null;
      end;

      if v_model_id is not null then
        new.model_id := v_model_id;
      end if;
    end if;
  end if;

  -- Resolve variant_id from draft data (only if still NULL, and model known, and variant text exists)
  if v_variant_id is null and v_variant_text is not null then
    v_model_id := coalesce(v_model_id, new.model_id);

    if v_model_id is not null then
      begin
        v_variant_id := public.resolve_variant_id(v_model_id, v_variant_text);
      exception when others then
        v_variant_id := null;
      end;

      if v_variant_id is not null then
        new.variant_id := v_variant_id;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_00_apply_canonical_vehicle_ids on public.listing_drafts;
create trigger trg_00_apply_canonical_vehicle_ids
before insert or update on public.listing_drafts
for each row
execute function public.apply_canonical_vehicle_ids_listing_drafts();