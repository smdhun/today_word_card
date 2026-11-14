/**
 * 타로 카드 맨 위에 거는 그림입니다. 달빛이 잔잔한 물에 비친 사진 100장입니다.
 * Pixabay에서 받은 사진이고, Pixabay Content License로 쓸 수 있습니다.
 * 각 항목 위 주석은 올린 사람과 원본 주소입니다.
 */
(function init_vignettes() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  root.VIGNETTE_FOLDER = "images/vignettes/";

  // 여섯 기분이 같은 100장을 씁니다. 기분마다 섞는 순서는 달라집니다.
  const moon_photos = [
    // Pixabay · Myriams-Fotos · https://pixabay.com/photos/good-night-full-moon-moonlight-2904747/
    { file: "moonwater/moon_001.jpg", caption: "달빛에 비친 물" },
    // Pixabay · jameswheeler · https://pixabay.com/photos/deck-lake-reflection-2297212/
    { file: "moonwater/moon_002.jpg", caption: "달빛에 비친 물" },
    // Pixabay · garten-gg · https://pixabay.com/photos/nature-landscape-night-moon-3766066/
    { file: "moonwater/moon_003.jpg", caption: "달빛에 비친 물" },
    // Pixabay · flutie8211 · https://pixabay.com/photos/cabin-moon-water-sky-stars-clouds-7494112/
    { file: "moonwater/moon_004.jpg", caption: "달빛에 비친 물" },
    // Pixabay · GPoulsen · https://pixabay.com/photos/ferry-lake-lake-como-como-italy-7747413/
    { file: "moonwater/moon_005.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Prabha_Creation388 · https://pixabay.com/photos/moon-lake-night-sky-blue-sky-7365342/
    { file: "moonwater/moon_006.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Monkey7 · https://pixabay.com/photos/lake-moon-night-moonlight-5026326/
    { file: "moonwater/moon_007.jpg", caption: "달빛에 비친 물" },
    // Pixabay · 15828491 · https://pixabay.com/photos/moon-lake-trees-water-heaven-5045776/
    { file: "moonwater/moon_008.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Flensshot · https://pixabay.com/photos/night-lake-constance-moon-lindau-3679882/
    { file: "moonwater/moon_009.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Baggeb · https://pixabay.com/photos/lake-space-sky-water-landscape-5177888/
    { file: "moonwater/moon_010.jpg", caption: "달빛에 비친 물" },
    // Pixabay · leonardovalente · https://pixabay.com/photos/pace-bend-park-austin-texas-950189/
    { file: "moonwater/moon_011.jpg", caption: "달빛에 비친 물" },
    // Pixabay · klug-pfuhlamsee · https://pixabay.com/photos/moon-moonlight-nature-lake-pond-7219143/
    { file: "moonwater/moon_012.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Bru-nO · https://pixabay.com/photos/night-dark-darkness-moon-heaven-2661800/
    { file: "moonwater/moon_013.jpg", caption: "달빛에 비친 물" },
    // Pixabay · torstensimon · https://pixabay.com/photos/moonlight-lake-hole-night-clouds-2962855/
    { file: "moonwater/moon_014.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Vasarae · https://pixabay.com/photos/horror-lake-moon-creepy-fear-5788499/
    { file: "moonwater/moon_015.jpg", caption: "달빛에 비친 물" },
    // Pixabay · PublicDomainPictures · https://pixabay.com/photos/landscape-night-moon-sky-stars-315179/
    { file: "moonwater/moon_016.jpg", caption: "달빛에 비친 물" },
    // Pixabay · sebamal80 · https://pixabay.com/photos/landscape-fishermen-night-lake-4120950/
    { file: "moonwater/moon_017.jpg", caption: "달빛에 비친 물" },
    // Pixabay · photo-graphe · https://pixabay.com/photos/moon-full-moon-sea-sky-night-sky-2762111/
    { file: "moonwater/moon_018.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Avia5 · https://pixabay.com/photos/astronomy-stars-nature-moon-sky-6513420/
    { file: "moonwater/moon_019.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Fleuber · https://pixabay.com/photos/pond-night-sky-landscape-moon-7651084/
    { file: "moonwater/moon_020.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Bru-nO · https://pixabay.com/photos/beach-sand-sea-lake-water-dusk-4481919/
    { file: "moonwater/moon_021.jpg", caption: "달빛에 비친 물" },
    // Pixabay · ELG21 · https://pixabay.com/photos/landscape-sea-night-darling-moon-4827278/
    { file: "moonwater/moon_022.jpg", caption: "달빛에 비친 물" },
    // Pixabay · ELG21 · https://pixabay.com/photos/lighthouse-sea-cliff-darling-9025426/
    { file: "moonwater/moon_023.jpg", caption: "달빛에 비친 물" },
    // Pixabay · ELG21 · https://pixabay.com/photos/landscape-sea-night-reflection-5062695/
    { file: "moonwater/moon_024.jpg", caption: "달빛에 비친 물" },
    // Pixabay · ELG21 · https://pixabay.com/photos/sea-night-moon-clouds-ocean-dark-9363645/
    { file: "moonwater/moon_025.jpg", caption: "달빛에 비친 물" },
    // Pixabay · susan-lu4esm · https://pixabay.com/photos/moon-night-reflection-dark-5175691/
    { file: "moonwater/moon_026.jpg", caption: "달빛에 비친 물" },
    // Pixabay · ELG21 · https://pixabay.com/photos/moon-sea-ship-galleon-barque-5803873/
    { file: "moonwater/moon_027.jpg", caption: "달빛에 비친 물" },
    // Pixabay · ELG21 · https://pixabay.com/photos/night-moon-sea-sky-reflection-5534318/
    { file: "moonwater/moon_028.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Arcaion · https://pixabay.com/photos/sea-night-moon-shine-light-2927115/
    { file: "moonwater/moon_029.jpg", caption: "달빛에 비친 물" },
    // Pixabay · flutie8211 · https://pixabay.com/photos/moon-sky-clouds-night-dark-ocean-7965365/
    { file: "moonwater/moon_030.jpg", caption: "달빛에 비친 물" },
    // Pixabay · SmuFotos · https://pixabay.com/photos/moon-water-reflection-night-eve-2395139/
    { file: "moonwater/moon_031.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Willgard · https://pixabay.com/photos/ocean-moon-boats-silhouettes-light-6020174/
    { file: "moonwater/moon_032.jpg", caption: "달빛에 비친 물" },
    // Pixabay · photo-graphe · https://pixabay.com/photos/moon-sea-light-reflections-1544530/
    { file: "moonwater/moon_033.jpg", caption: "달빛에 비친 물" },
    // Pixabay · BiancaVanDijk · https://pixabay.com/photos/moon-full-moon-sea-ocean-night-6910471/
    { file: "moonwater/moon_034.jpg", caption: "달빛에 비친 물" },
    // Pixabay · anaterate · https://pixabay.com/photos/sea-moon-night-fishing-boat-6856232/
    { file: "moonwater/moon_035.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Arcaion · https://pixabay.com/photos/night-sea-moon-sea-ocean-chilly-4231465/
    { file: "moonwater/moon_036.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Annagiang · https://pixabay.com/photos/moon-sea-full-moon-light-reflective-4870040/
    { file: "moonwater/moon_037.jpg", caption: "달빛에 비친 물" },
    // Pixabay · TanerSoyler · https://pixabay.com/photos/night-moon-moonlight-landscape-4344828/
    { file: "moonwater/moon_038.jpg", caption: "달빛에 비친 물" },
    // Pixabay · ELG21 · https://pixabay.com/photos/landscape-night-sea-moon-4762468/
    { file: "moonwater/moon_039.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Avia5 · https://pixabay.com/photos/moon-sky-sea-moonlight-light-6269416/
    { file: "moonwater/moon_040.jpg", caption: "달빛에 비친 물" },
    // Pixabay · ELG21 · https://pixabay.com/photos/landscape-sea-darling-night-4450876/
    { file: "moonwater/moon_041.jpg", caption: "달빛에 비친 물" },
    // Pixabay · yousafbhutta · https://pixabay.com/photos/sea-moon-night-full-moon-moonlight-6496073/
    { file: "moonwater/moon_042.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Photoshop-Art · https://pixabay.com/photos/ship-sea-night-sunset-lake-6137910/
    { file: "moonwater/moon_043.jpg", caption: "달빛에 비친 물" },
    // Pixabay · yousafbhutta · https://pixabay.com/photos/sea-moon-night-full-moon-moonlight-6496074/
    { file: "moonwater/moon_044.jpg", caption: "달빛에 비친 물" },
    // Pixabay · ELG21 · https://pixabay.com/photos/landscape-sea-reflection-night-5176891/
    { file: "moonwater/moon_045.jpg", caption: "달빛에 비친 물" },
    // Pixabay · anne_hechtfisch · https://pixabay.com/photos/water-lake-sea-clouds-darkness-385850/
    { file: "moonwater/moon_046.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Engin_Akyurt · https://pixabay.com/photos/view-moon-night-evening-sea-4576390/
    { file: "moonwater/moon_047.jpg", caption: "달빛에 비친 물" },
    // Pixabay · yousafbhutta · https://pixabay.com/photos/sea-moon-night-full-moon-moonlight-6496076/
    { file: "moonwater/moon_048.jpg", caption: "달빛에 비친 물" },
    // Pixabay · yousafbhutta · https://pixabay.com/photos/sea-moon-night-full-moon-moonlight-6496083/
    { file: "moonwater/moon_049.jpg", caption: "달빛에 비친 물" },
    // Pixabay · 12019 · https://pixabay.com/photos/night-aircraft-carrier-ship-sea-79591/
    { file: "moonwater/moon_050.jpg", caption: "달빛에 비친 물" },
    // Pixabay · StockSnap · https://pixabay.com/photos/cannon-moon-sky-night-dark-2625410/
    { file: "moonwater/moon_051.jpg", caption: "달빛에 비친 물" },
    // Pixabay · aiwonders1331 · https://pixabay.com/photos/moon-trees-beach-coconut-tropical-7970324/
    { file: "moonwater/moon_052.jpg", caption: "달빛에 비친 물" },
    // Pixabay · 강춘성 · https://pixabay.com/photos/ocean-night-sky-windmills-beach-6655554/
    { file: "moonwater/moon_053.jpg", caption: "달빛에 비친 물" },
    // Pixabay · yousafbhutta · https://pixabay.com/photos/sea-moon-night-full-moon-moonlight-6496071/
    { file: "moonwater/moon_054.jpg", caption: "달빛에 비친 물" },
    // Pixabay · yousafbhutta · https://pixabay.com/photos/beach-sea-night-shore-moon-fence-6496070/
    { file: "moonwater/moon_055.jpg", caption: "달빛에 비친 물" },
    // Pixabay · yousafbhutta · https://pixabay.com/photos/sea-moon-night-full-moon-moonlight-6496097/
    { file: "moonwater/moon_056.jpg", caption: "달빛에 비친 물" },
    // Pixabay · yousafbhutta · https://pixabay.com/photos/beach-sea-night-shore-moon-fence-6496068/
    { file: "moonwater/moon_057.jpg", caption: "달빛에 비친 물" },
    // Pixabay · yousafbhutta · https://pixabay.com/photos/beach-sea-night-shore-moon-6496069/
    { file: "moonwater/moon_058.jpg", caption: "달빛에 비친 물" },
    // Pixabay · scholty1970 · https://pixabay.com/photos/night-eve-boat-beach-sea-3955545/
    { file: "moonwater/moon_059.jpg", caption: "달빛에 비친 물" },
    // Pixabay · susan-lu4esm · https://pixabay.com/photos/dusk-night-sea-water-red-moon-3830812/
    { file: "moonwater/moon_060.jpg", caption: "달빛에 비친 물" },
    // Pixabay · DenisDoukhan · https://pixabay.com/photos/moon-night-stars-sea-dark-6218074/
    { file: "moonwater/moon_061.jpg", caption: "달빛에 비친 물" },
    // Pixabay · AMDUMA · https://pixabay.com/photos/moon-reflection-sea-night-5419766/
    { file: "moonwater/moon_062.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Tumisu · https://pixabay.com/photos/moon-sea-moonlight-landscape-6234627/
    { file: "moonwater/moon_063.jpg", caption: "달빛에 비친 물" },
    // Pixabay · moritz320 · https://pixabay.com/photos/sea-moon-eve-night-heaven-water-2151889/
    { file: "moonwater/moon_064.jpg", caption: "달빛에 비친 물" },
    // Pixabay · SNies · https://pixabay.com/photos/heaven-nature-winter-snow-3073700/
    { file: "moonwater/moon_065.jpg", caption: "달빛에 비친 물" },
    // Pixabay · postcardtrip · https://pixabay.com/photos/ocean-sea-night-moon-sun-water-4587663/
    { file: "moonwater/moon_066.jpg", caption: "달빛에 비친 물" },
    // Pixabay · JuliusH · https://pixabay.com/photos/sea-moon-night-heaven-stars-6169397/
    { file: "moonwater/moon_067.jpg", caption: "달빛에 비친 물" },
    // Pixabay · kejamy · https://pixabay.com/photos/lunar-path-moon-path-moon-moonlight-4813893/
    { file: "moonwater/moon_068.jpg", caption: "달빛에 비친 물" },
    // Pixabay · adambradway · https://pixabay.com/photos/beach-night-moon-2360820/
    { file: "moonwater/moon_069.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Darkmoon_Art · https://pixabay.com/photos/forest-waterfall-bach-moss-4068618/
    { file: "moonwater/moon_070.jpg", caption: "달빛에 비친 물" },
    // Pixabay · ELG21 · https://pixabay.com/photos/landscape-sea-whales-darling-moon-5200752/
    { file: "moonwater/moon_071.jpg", caption: "달빛에 비친 물" },
    // Pixabay · KonradJanik · https://pixabay.com/photos/moon-night-beach-sea-travel-6892902/
    { file: "moonwater/moon_072.jpg", caption: "달빛에 비친 물" },
    // Pixabay · ImaArtist · https://pixabay.com/photos/ring-world-moon-planet-sky-sunset-4605013/
    { file: "moonwater/moon_073.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Sa_ita · https://pixabay.com/photos/ocean-sea-seascape-trunk-nature-7035569/
    { file: "moonwater/moon_074.jpg", caption: "달빛에 비친 물" },
    // Pixabay · LalalaB · https://pixabay.com/photos/night-sky-moon-sea-night-violett-523892/
    { file: "moonwater/moon_075.jpg", caption: "달빛에 비친 물" },
    // Pixabay · TheDigitalArtist · https://pixabay.com/photos/moon-reflection-ocean-water-night-3746698/
    { file: "moonwater/moon_076.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Myriams-Fotos · https://pixabay.com/photos/sailboat-ship-boat-water-waters-2820638/
    { file: "moonwater/moon_077.jpg", caption: "달빛에 비친 물" },
    // Pixabay · johnkantas · https://pixabay.com/photos/ship-sail-ship-moon-ocean-sea-5532154/
    { file: "moonwater/moon_078.jpg", caption: "달빛에 비친 물" },
    // Pixabay · ds_30 · https://pixabay.com/photos/sea-storm-wave-spray-foam-gull-4783301/
    { file: "moonwater/moon_079.jpg", caption: "달빛에 비친 물" },
    // Pixabay · ELG21 · https://pixabay.com/photos/ship-sea-waves-night-mist-fog-6248244/
    { file: "moonwater/moon_080.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Bru-nO · https://pixabay.com/photos/lunar-eclipse-moon-blood-moon-4543464/
    { file: "moonwater/moon_081.jpg", caption: "달빛에 비친 물" },
    // Pixabay · JDGRAPHICS63 · https://pixabay.com/photos/sea-boats-sail-storm-rain-7049274/
    { file: "moonwater/moon_082.jpg", caption: "달빛에 비친 물" },
    // Pixabay · ananthu_nalloor · https://pixabay.com/photos/moon-night-moonlight-sky-mood-3632080/
    { file: "moonwater/moon_083.jpg", caption: "달빛에 비친 물" },
    // Pixabay · mikhsan · https://pixabay.com/photos/water-sea-evening-night-3380259/
    { file: "moonwater/moon_084.jpg", caption: "달빛에 비친 물" },
    // Pixabay · 21967857 · https://pixabay.com/photos/sea-moon-night-ocean-background-6579256/
    { file: "moonwater/moon_085.jpg", caption: "달빛에 비친 물" },
    // Pixabay · huanlihit · https://pixabay.com/photos/river-port-moonlight-full-moon-5902079/
    { file: "moonwater/moon_086.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Hans · https://pixabay.com/photos/moon-moonlight-full-moon-dark-232195/
    { file: "moonwater/moon_087.jpg", caption: "달빛에 비친 물" },
    // Pixabay · LUX-187 · https://pixabay.com/photos/hamburg-moon-heaven-blue-night-715217/
    { file: "moonwater/moon_088.jpg", caption: "달빛에 비친 물" },
    // Pixabay · DiceME · https://pixabay.com/photos/moon-night-trees-park-pond-7511501/
    { file: "moonwater/moon_089.jpg", caption: "달빛에 비친 물" },
    // Pixabay · huanlihit · https://pixabay.com/photos/river-port-moonlight-full-moon-5902074/
    { file: "moonwater/moon_090.jpg", caption: "달빛에 비친 물" },
    // Pixabay · ELG21 · https://pixabay.com/photos/moon-nature-travel-exploration-6616006/
    { file: "moonwater/moon_091.jpg", caption: "달빛에 비친 물" },
    // Pixabay · moritz320 · https://pixabay.com/photos/sea-moon-eve-night-heaven-water-2151880/
    { file: "moonwater/moon_092.jpg", caption: "달빛에 비친 물" },
    // Pixabay · 22962316 · https://pixabay.com/photos/river-canyon-moon-sky-galaxy-8155946/
    { file: "moonwater/moon_093.jpg", caption: "달빛에 비친 물" },
    // Pixabay · foolhouse · https://pixabay.com/photos/moon-river-sky-night-asia-korea-4615547/
    { file: "moonwater/moon_094.jpg", caption: "달빛에 비친 물" },
    // Pixabay · PublicDomainPictures · https://pixabay.com/photos/river-water-moon-night-moonlight-21103/
    { file: "moonwater/moon_095.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Arcaion · https://pixabay.com/photos/railway-line-train-transport-trip-3033476/
    { file: "moonwater/moon_096.jpg", caption: "달빛에 비친 물" },
    // Pixabay · gene1970 · https://pixabay.com/photos/camper-camping-tent-planets-moon-7088130/
    { file: "moonwater/moon_097.jpg", caption: "달빛에 비친 물" },
    // Pixabay · PublicDomainPictures · https://pixabay.com/photos/moon-sea-chalk-cliffs-beach-night-21655/
    { file: "moonwater/moon_098.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Aris_Tsitiridis · https://pixabay.com/photos/night-landscape-water-outdoor-dark-2764685/
    { file: "moonwater/moon_099.jpg", caption: "달빛에 비친 물" },
    // Pixabay · ekamelev · https://pixabay.com/photos/night-landscape-night-landscape-3622557/
    { file: "moonwater/moon_100.jpg", caption: "달빛에 비친 물" },
  ];

  root.VIGNETTES = {
    joy: moon_photos,
    calm: moon_photos,
    excited: moon_photos,
    anxious: moon_photos,
    tired: moon_photos,
    sad: moon_photos,
  };
})();
