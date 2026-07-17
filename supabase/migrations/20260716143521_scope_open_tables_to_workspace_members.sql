-- loan_trackers, income_timeline, dan debt_planner_settings memakai
-- USING(true) untuk ALL: setiap pengguna terautentikasi bisa membaca dan
-- menulis data pinjol/penghasilan milik pengguna lain. Samakan dengan pola
-- yang sudah dipakai tabel transactions: batasi ke anggota workspace.
-- Ketiga tabel saat ini kosong, jadi tidak ada data yang kehilangan akses.

drop policy if exists "Members can manage loan_trackers" on public.loan_trackers;
create policy "Members can manage loan_trackers"
  on public.loan_trackers for all
  using (public.is_workspace_member(workspace_id, auth.uid()))
  with check (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists "Members can view loan_trackers" on public.loan_trackers;
create policy "Members can view loan_trackers"
  on public.loan_trackers for select
  using (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists "Members can manage income_timeline" on public.income_timeline;
create policy "Members can manage income_timeline"
  on public.income_timeline for all
  using (public.is_workspace_member(workspace_id, auth.uid()))
  with check (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists "Members can view income_timeline" on public.income_timeline;
create policy "Members can view income_timeline"
  on public.income_timeline for select
  using (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists "Members can manage debt_planner_settings" on public.debt_planner_settings;
create policy "Members can manage debt_planner_settings"
  on public.debt_planner_settings for all
  using (public.is_workspace_member(workspace_id, auth.uid()))
  with check (public.is_workspace_member(workspace_id, auth.uid()));

drop policy if exists "Members can view debt_planner_settings" on public.debt_planner_settings;
create policy "Members can view debt_planner_settings"
  on public.debt_planner_settings for select
  using (public.is_workspace_member(workspace_id, auth.uid()));
