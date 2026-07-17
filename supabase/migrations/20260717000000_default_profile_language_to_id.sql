-- Aplikasi ini berbahasa Indonesia (pinjol, gajian, dsb) tetapi kolom language
-- default-nya 'en', sehingga setiap pengguna baru mendapat antarmuka Inggris
-- meski seluruh terjemahan Indonesia sudah tersedia.
-- Hanya default yang diubah; baris yang sudah ada tidak disentuh supaya pilihan
-- bahasa pengguna yang memang sengaja memilih Inggris tidak ditimpa.
alter table public.profiles alter column language set default 'id';
