-- Re-runs the gallery_url backfill from 20260504400000_wtcd_backfill_gallery_urls.sql
-- because that migration was applied to prod when public.wtcd_events
-- was empty — so its 6-row UPDATE matched nothing. After
-- 20260504350000_wtcd_seed_initial.sql lands the 7 base events on
-- prod, this migration runs the same idempotent UPDATE so those rows
-- pick up their Google Photos album URLs.
--
-- Same `gallery_url is null` guard, so admin edits are still safe.

update public.wtcd_events
set gallery_url = case year
  when 2019 then 'https://photos.google.com/share/AF1QipNsWHviMOJAQzqM6SjamCLZSeFW70eV1x-IuzjMI5y6Y-BX3axS9-Fub8U1hikoNQ?key=bmR0T1BPVG9VZThCa3h0emNtaGl1Y21zanhpS1ln'
  when 2021 then 'https://photos.google.com/u/1/share/AF1QipMD_NqbJJq6LJ_fc0z-TBKcNa_FmgikT1YgoeX6lNfQZDqERAnj4-xaAeU8-eUMVg?key=cE4wUkxxMHotNFpCNnRDeUZXNTJRQXVGa3NIU2hn'
  when 2022 then 'https://photos.app.goo.gl/zC34s2fZ73ZCFmJv5'
  when 2023 then 'https://photos.app.goo.gl/7R8VAFjaup7hHwXs7'
  when 2024 then 'https://photos.google.com/photo/AF1QipMU1MH_2HOlOeNkg7EzaQHzVCBzK05-1WGKWzPe'
  when 2025 then 'https://photos.google.com/share/AF1QipN3iGl1qScpx6U2pmQFMW0amSvVA53N6pKQZ1GJxekw-Aw6NDeI7sG-8LMVB5MEoQ?key=Q1FpNVZ4OGQyVndwX1MtSXBBbzlBSHBfNk50QUhn'
end
where year in (2019, 2021, 2022, 2023, 2024, 2025)
  and gallery_url is null;
