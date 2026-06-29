DELETE FROM collections;
INSERT OR IGNORE INTO collections (id, name, dynasty, description, count) VALUES
('tang', '唐诗', '唐', '唐诗', 57603),
('song-poetry', '宋诗', '宋', '宋诗', 254225),
('song-ci', '宋词', '宋', '宋词', 21050),
('yuanqu', '元曲', '元', '元曲', 10914),
('yuding', '御定全唐诗', '唐', '御定全唐诗', 43103),
('shijing', '诗经', '先秦', '诗经', 305),
('chuci', '楚辞', '战国', '楚辞', 65);
