/**
 * 타로 카드 맨 위에 거는 그림입니다. 달빛이 잔잔한 물에 비친 세로 사진 100장입니다.
 * 가로로 긴 사진은 넣지 않았습니다.
 * Pixabay에서 받은 사진이고, Pixabay Content License로 쓸 수 있습니다.
 * 각 항목 위 주석은 올린 사람과 원본 주소입니다.
 */
(function init_vignettes() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  root.VIGNETTE_FOLDER = "images/vignettes/";

  // 여섯 기분이 같은 세로 사진 100장을 씁니다. 기분마다 섞는 순서는 달라집니다.
  const moon_photos = [
    // Pixabay · Impermanent · https://pixabay.com/photos/forest-lake-moon-night-wallpaper-7097457/
    { file: "moonwater/moon_001.jpg", caption: "달빛에 비친 물" },
    // Pixabay · roameramit · https://pixabay.com/photos/sea-night-full-moon-puducherry-6587834/
    { file: "moonwater/moon_002.jpg", caption: "달빛에 비친 물" },
    // Pixabay · nikos_ntnts · https://pixabay.com/photos/lake-moon-moonlight-water-night-5947415/
    { file: "moonwater/moon_003.jpg", caption: "달빛에 비친 물" },
    // Pixabay · samyasharf · https://pixabay.com/photos/winter-night-moon-mountain-4710216/
    { file: "moonwater/moon_004.jpg", caption: "달빛에 비친 물" },
    // Pixabay · maja7777 · https://pixabay.com/photos/moonlight-water-glitter-full-moon-1465210/
    { file: "moonwater/moon_005.jpg", caption: "달빛에 비친 물" },
    // Pixabay · aronvisuals · https://pixabay.com/photos/river-fog-night-lake-clouds-8448849/
    { file: "moonwater/moon_006.jpg", caption: "달빛에 비친 물" },
    // Pixabay · salahaldin1000 · https://pixabay.com/photos/mystical-stag-celestial-deer-9261973/
    { file: "moonwater/moon_007.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Bajora · https://pixabay.com/photos/sky-evening-moon-colours-7445243/
    { file: "moonwater/moon_008.jpg", caption: "달빛에 비친 물" },
    // Pixabay · sharkolot · https://pixabay.com/photos/moon-clouds-first-quarter-poster-7105626/
    { file: "moonwater/moon_009.jpg", caption: "달빛에 비친 물" },
    // Pixabay · DeltaWorks · https://pixabay.com/photos/mackerel-sky-moonlit-night-clouds-449475/
    { file: "moonwater/moon_010.jpg", caption: "달빛에 비친 물" },
    // Pixabay · JoshuaWoroniecki · https://pixabay.com/photos/tree-field-nature-sunset-twilight-7317683/
    { file: "moonwater/moon_011.jpg", caption: "달빛에 비친 물" },
    // Pixabay · elizabethannphotolv · https://pixabay.com/photos/full-moon-dark-spooky-sky-clouds-1372783/
    { file: "moonwater/moon_012.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Arcaion · https://pixabay.com/photos/night-sea-moon-sea-ocean-vertical-4231466/
    { file: "moonwater/moon_013.jpg", caption: "달빛에 비친 물" },
    // Pixabay · stafichukanatoly · https://pixabay.com/photos/night-moon-sky-stars-night-view-1991590/
    { file: "moonwater/moon_014.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Amely · https://pixabay.com/photos/landscape-sea-moon-heaven-fog-1235270/
    { file: "moonwater/moon_015.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Mahi8 · https://pixabay.com/photos/ocean-night-dark-water-waves-beach-10163959/
    { file: "moonwater/moon_016.jpg", caption: "달빛에 비친 물" },
    // Pixabay · gdmoonkiller · https://pixabay.com/photos/fortress-window-moon-night-6240050/
    { file: "moonwater/moon_017.jpg", caption: "달빛에 비친 물" },
    // Pixabay · flutie8211 · https://pixabay.com/photos/music-piano-notes-paper-beethoven-7223989/
    { file: "moonwater/moon_018.jpg", caption: "달빛에 비친 물" },
    // Pixabay · geralt · https://pixabay.com/photos/church-moon-night-the-shade-stars-65183/
    { file: "moonwater/moon_019.jpg", caption: "달빛에 비친 물" },
    // Pixabay · LindenP · https://pixabay.com/photos/winter-snow-moon-horizon-cold-sky-2338577/
    { file: "moonwater/moon_020.jpg", caption: "달빛에 비친 물" },
    // Pixabay · fcja99 · https://pixabay.com/photos/full-moon-night-rock-forest-alps-2299605/
    { file: "moonwater/moon_021.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Maxiline · https://pixabay.com/photos/moon-blurred-clouds-blue-330068/
    { file: "moonwater/moon_022.jpg", caption: "달빛에 비친 물" },
    // Pixabay · garten-gg · https://pixabay.com/photos/lantern-lamp-light-lighting-1219640/
    { file: "moonwater/moon_023.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Bru-nO · https://pixabay.com/photos/night-moon-lake-heaven-full-moon-1748853/
    { file: "moonwater/moon_024.jpg", caption: "달빛에 비친 물" },
    // Pixabay · TrzykropkiCOM · https://pixabay.com/photos/sea-clouds-the-waves-moonlight-2855771/
    { file: "moonwater/moon_025.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Aris_Tsitiridis · https://pixabay.com/photos/moon-sea-boat-night-ocean-sky-2764724/
    { file: "moonwater/moon_026.jpg", caption: "달빛에 비친 물" },
    // Pixabay · jackdanlere · https://pixabay.com/photos/ramadan-mosque-ramadhan-eid-pray-5128849/
    { file: "moonwater/moon_027.jpg", caption: "달빛에 비친 물" },
    // Pixabay · 13342248 · https://pixabay.com/photos/knight-crusader-monument-moon-7352205/
    { file: "moonwater/moon_028.jpg", caption: "달빛에 비친 물" },
    // Pixabay · GPoulsen · https://pixabay.com/photos/bellagio-italy-lake-lake-como-como-7708548/
    { file: "moonwater/moon_029.jpg", caption: "달빛에 비친 물" },
    // Pixabay · orterrym · https://pixabay.com/photos/moon-rise-ocean-beach-moon-sea-2047295/
    { file: "moonwater/moon_030.jpg", caption: "달빛에 비친 물" },
    // Pixabay · jhamel0210 · https://pixabay.com/photos/croatia-sea-night-moon-hvar-7419913/
    { file: "moonwater/moon_031.jpg", caption: "달빛에 비친 물" },
    // Pixabay · flutie8211 · https://pixabay.com/photos/music-classical-beethoven-composer-7157136/
    { file: "moonwater/moon_032.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Rico785 · https://pixabay.com/photos/moon-stars-sea-water-moonlight-7617426/
    { file: "moonwater/moon_033.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Tej_Photography · https://pixabay.com/photos/moon-love-moonlight-night-art-4740099/
    { file: "moonwater/moon_034.jpg", caption: "달빛에 비친 물" },
    // Pixabay · u_gdmv7ramzs · https://pixabay.com/photos/river-night-moon-edmundston-gorge-7294102/
    { file: "moonwater/moon_035.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Sir_Fomi · https://pixabay.com/photos/night-moon-old-house-storm-4737942/
    { file: "moonwater/moon_036.jpg", caption: "달빛에 비친 물" },
    // Pixabay · CODO_NZ · https://pixabay.com/photos/moon-night-space-nature-sky-8655395/
    { file: "moonwater/moon_037.jpg", caption: "달빛에 비친 물" },
    // Pixabay · LeoEspina · https://pixabay.com/photos/night-darkness-moon-landscape-7855145/
    { file: "moonwater/moon_038.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Rudimar · https://pixabay.com/photos/sun-reflex-river-watersea-loght-1476095/
    { file: "moonwater/moon_039.jpg", caption: "달빛에 비친 물" },
    // Pixabay · MANUTIFWORLD · https://pixabay.com/photos/moon-sea-night-landscape-darling-4974842/
    { file: "moonwater/moon_040.jpg", caption: "달빛에 비친 물" },
    // Pixabay · sabrina1982 · https://pixabay.com/photos/evening-air-full-moon-heaven-2042555/
    { file: "moonwater/moon_041.jpg", caption: "달빛에 비친 물" },
    // Pixabay · LoggaWiggler · https://pixabay.com/photos/full-moon-moon-night-romance-4797/
    { file: "moonwater/moon_042.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Snap_it · https://pixabay.com/photos/moon-astronomy-crescent-moon-3097845/
    { file: "moonwater/moon_043.jpg", caption: "달빛에 비친 물" },
    // Pixabay · nero235 · https://pixabay.com/photos/sky-moon-sunset-dolomites-7644924/
    { file: "moonwater/moon_044.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Noupload · https://pixabay.com/photos/night-full-moon-ship-lake-ocean-2860531/
    { file: "moonwater/moon_045.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Rudimar · https://pixabay.com/photos/light-landscape-nature-water-1476128/
    { file: "moonwater/moon_046.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Marshell01 · https://pixabay.com/photos/sky-moon-night-sky-celestial-body-7357611/
    { file: "moonwater/moon_047.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Quadronet_Webdesign · https://pixabay.com/photos/moon-blood-moon-grapevine-4508303/
    { file: "moonwater/moon_048.jpg", caption: "달빛에 비친 물" },
    // Pixabay · BiancaVanDijk · https://pixabay.com/photos/christmas-tree-full-moon-christmas-6749796/
    { file: "moonwater/moon_049.jpg", caption: "달빛에 비친 물" },
    // Pixabay · 20092854 · https://pixabay.com/photos/astronomy-moon-night-sky-moonlight-7478716/
    { file: "moonwater/moon_050.jpg", caption: "달빛에 비친 물" },
    // Pixabay · WILFRIDO-06 · https://pixabay.com/photos/door-tori-sanctuary-japan-gate-7000547/
    { file: "moonwater/moon_051.jpg", caption: "달빛에 비친 물" },
    // Pixabay · StockSnap · https://pixabay.com/photos/sea-ocean-water-reflection-dark-2598680/
    { file: "moonwater/moon_052.jpg", caption: "달빛에 비친 물" },
    // Pixabay · johnNaturePhotos · https://pixabay.com/photos/moon-plane-sky-airport-environment-4494055/
    { file: "moonwater/moon_053.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Danicku · https://pixabay.com/photos/moon-full-moon-night-sky-nature-8977707/
    { file: "moonwater/moon_054.jpg", caption: "달빛에 비친 물" },
    // Pixabay · felixeschke · https://pixabay.com/photos/moon-sky-full-moon-night-moonlight-7010821/
    { file: "moonwater/moon_055.jpg", caption: "달빛에 비친 물" },
    // Pixabay · pdominic842 · https://pixabay.com/photos/trees-road-highway-moon-forest-6121990/
    { file: "moonwater/moon_056.jpg", caption: "달빛에 비친 물" },
    // Pixabay · GemzDesigns · https://pixabay.com/photos/nature-water-landscape-sky-moon-3244335/
    { file: "moonwater/moon_057.jpg", caption: "달빛에 비친 물" },
    // Pixabay · stevenbatty · https://pixabay.com/photos/moon-mountain-stars-crescent-night-7218784/
    { file: "moonwater/moon_058.jpg", caption: "달빛에 비친 물" },
    // Pixabay · gustavmelin0 · https://pixabay.com/photos/moonlight-night-norway-lofoten-664811/
    { file: "moonwater/moon_059.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Natalia_Kollegova · https://pixabay.com/photos/koster-fire-sparks-night-flame-2551651/
    { file: "moonwater/moon_060.jpg", caption: "달빛에 비친 물" },
    // Pixabay · RAJA-cse · https://pixabay.com/photos/nature-moon-moonlight-zooming-4649796/
    { file: "moonwater/moon_061.jpg", caption: "달빛에 비친 물" },
    // Pixabay · fietzfotos · https://pixabay.com/photos/church-moon-night-meadow-6807522/
    { file: "moonwater/moon_062.jpg", caption: "달빛에 비친 물" },
    // Pixabay · gregorylime · https://pixabay.com/photos/moon-night-sky-forest-crescent-moon-348852/
    { file: "moonwater/moon_063.jpg", caption: "달빛에 비친 물" },
    // Pixabay · StockSnap · https://pixabay.com/photos/dark-night-sky-moon-nature-tree-2600139/
    { file: "moonwater/moon_064.jpg", caption: "달빛에 비친 물" },
    // Pixabay · 2690457 · https://pixabay.com/photos/night-street-pavement-trees-1609575/
    { file: "moonwater/moon_065.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Reutig3 · https://pixabay.com/photos/moon-full-moon-universe-galaxy-8312902/
    { file: "moonwater/moon_066.jpg", caption: "달빛에 비친 물" },
    // Pixabay · nagalappa · https://pixabay.com/photos/moon-night-sky-the-night-sky-3943498/
    { file: "moonwater/moon_067.jpg", caption: "달빛에 비친 물" },
    // Pixabay · GpeeJu · https://pixabay.com/photos/lighthouse-merry-go-round-game-moon-4804668/
    { file: "moonwater/moon_068.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Jonny_Joka · https://pixabay.com/photos/greece-moon-sundown-evening-6773700/
    { file: "moonwater/moon_069.jpg", caption: "달빛에 비친 물" },
    // Pixabay · vitorsilva98 · https://pixabay.com/photos/night-moon-moonlight-sky-universe-8327691/
    { file: "moonwater/moon_070.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Hans · https://pixabay.com/photos/pasture-tree-backlighting-branches-324559/
    { file: "moonwater/moon_071.jpg", caption: "달빛에 비친 물" },
    // Pixabay · blackham · https://pixabay.com/photos/winter-moon-moon-winter-night-4841357/
    { file: "moonwater/moon_072.jpg", caption: "달빛에 비친 물" },
    // Pixabay · wl1212 · https://pixabay.com/photos/moon-night-astronomy-satellite-6714872/
    { file: "moonwater/moon_073.jpg", caption: "달빛에 비친 물" },
    // Pixabay · jadamoo2018 · https://pixabay.com/photos/river-night-starry-sky-lake-4025920/
    { file: "moonwater/moon_074.jpg", caption: "달빛에 비친 물" },
    // Pixabay · kropekk_pl · https://pixabay.com/photos/moon-night-sky-full-view-1320355/
    { file: "moonwater/moon_075.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Hans · https://pixabay.com/photos/moonlight-tree-poplar-silver-poplar-232135/
    { file: "moonwater/moon_076.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Mjkarki2012 · https://pixabay.com/photos/astronomy-moon-satellite-night-7067715/
    { file: "moonwater/moon_077.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Elara123 · https://pixabay.com/photos/moon-full-night-full-moon-8290246/
    { file: "moonwater/moon_078.jpg", caption: "달빛에 비친 물" },
    // Pixabay · makamuki0 · https://pixabay.com/photos/moon-detail-satelite-crater-night-1971706/
    { file: "moonwater/moon_079.jpg", caption: "달빛에 비친 물" },
    // Pixabay · ikinitip · https://pixabay.com/photos/night-moon-elephant-statue-61131/
    { file: "moonwater/moon_080.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Fitze · https://pixabay.com/photos/full-moon-night-moon-the-atmosphere-186507/
    { file: "moonwater/moon_081.jpg", caption: "달빛에 비친 물" },
    // Pixabay · LoggaWiggler · https://pixabay.com/photos/balanced-rock-night-moonlight-moon-4629/
    { file: "moonwater/moon_082.jpg", caption: "달빛에 비친 물" },
    // Pixabay · trogdorjr · https://pixabay.com/photos/moon-night-sky-night-moonlight-6918631/
    { file: "moonwater/moon_083.jpg", caption: "달빛에 비친 물" },
    // Pixabay · 14863258 · https://pixabay.com/photos/moon-night-sky-full-moon-night-sky-5137123/
    { file: "moonwater/moon_084.jpg", caption: "달빛에 비친 물" },
    // Pixabay · konstantinrotkevich · https://pixabay.com/photos/moon-evening-sickle-month-sea-7720006/
    { file: "moonwater/moon_085.jpg", caption: "달빛에 비친 물" },
    // Pixabay · david_hzmn · https://pixabay.com/photos/moon-night-heaven-moonlight-5360162/
    { file: "moonwater/moon_086.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Pinpals · https://pixabay.com/photos/moon-landscape-tree-night-sky-217849/
    { file: "moonwater/moon_087.jpg", caption: "달빛에 비친 물" },
    // Pixabay · annevais · https://pixabay.com/photos/moon-moonrise-evening-dark-1061473/
    { file: "moonwater/moon_088.jpg", caption: "달빛에 비친 물" },
    // Pixabay · susan-lu4esm · https://pixabay.com/photos/nature-tree-lake-water-reflection-4726122/
    { file: "moonwater/moon_089.jpg", caption: "달빛에 비친 물" },
    // Pixabay · bones64 · https://pixabay.com/photos/sunset-clouds-puffy-sky-moon-2363670/
    { file: "moonwater/moon_090.jpg", caption: "달빛에 비친 물" },
    // Pixabay · LeoEspina · https://pixabay.com/photos/sea-moon-sunset-water-dusk-7855153/
    { file: "moonwater/moon_091.jpg", caption: "달빛에 비친 물" },
    // Pixabay · ELG21 · https://pixabay.com/photos/landscape-pine-moon-mountain-8336496/
    { file: "moonwater/moon_092.jpg", caption: "달빛에 비친 물" },
    // Pixabay · slightly_different · https://pixabay.com/photos/moon-sunset-starry-sky-water-2732993/
    { file: "moonwater/moon_093.jpg", caption: "달빛에 비친 물" },
    // Pixabay · aronvisuals · https://pixabay.com/photos/mountain-valley-night-nature-3807667/
    { file: "moonwater/moon_094.jpg", caption: "달빛에 비친 물" },
    // Pixabay · xiSerge · https://pixabay.com/photos/swiss-alps-switzerland-moon-8216616/
    { file: "moonwater/moon_095.jpg", caption: "달빛에 비친 물" },
    // Pixabay · sunbeamphoto · https://pixabay.com/photos/lake-trees-moon-planet-mountains-5905976/
    { file: "moonwater/moon_096.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Bajora · https://pixabay.com/photos/moon-blood-moon-night-colorful-7468634/
    { file: "moonwater/moon_097.jpg", caption: "달빛에 비친 물" },
    // Pixabay · ekamelev · https://pixabay.com/photos/landscape-wave-sky-evening-wind-3538917/
    { file: "moonwater/moon_098.jpg", caption: "달빛에 비친 물" },
    // Pixabay · 51581 · https://pixabay.com/photos/moon-mountains-lava-full-moon-2864663/
    { file: "moonwater/moon_099.jpg", caption: "달빛에 비친 물" },
    // Pixabay · Travis21 · https://pixabay.com/photos/moon-waves-wallpaper-sea-ocean-6482324/
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
