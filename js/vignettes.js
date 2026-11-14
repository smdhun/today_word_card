/**
 * 카드 맨 위에 거는 그림 덱입니다. 기분마다 15장씩 따로 있습니다.
 * 문장뽑기를 15번 누르기 전에는 같은 기분 안에서 그림이 겹치지 않습니다.
 *
 * 출처: Wikimedia Commons (https://commons.wikimedia.org/)
 * 퍼블릭 도메인 또는 CC0로 공개된 사진만 골라, 카드 크기(640x349)로 잘라 저장했습니다.
 * 각 항목 위의 주석은 저작자, 라이선스, 원본 주소입니다.
 */
(function init_vignettes() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  root.VIGNETTE_FOLDER = "images/vignettes/";

  root.VIGNETTES = {
    joy: [
      // USFWS Mountain Prairie · public domain · https://commons.wikimedia.org/w/index.php?curid=163261723
      { file: "joy/sunrise_ridge.jpg", caption: "금빛 능선" },
      // Bonnie Moreland from Oregon, United States · public domain · https://commons.wikimedia.org/w/index.php?curid=110444552
      { file: "joy/sunset_lake_pines.jpg", caption: "노을 진 호수" },
      // Quinsey Sablan qsablan · cc0 · https://commons.wikimedia.org/w/index.php?curid=61694793
      { file: "joy/meadow_sunrise.jpg", caption: "꽃밭의 아침" },
      // Jakub Kriz jakubkriz · cc0 · https://commons.wikimedia.org/w/index.php?curid=61819140
      { file: "joy/sun_over_hills.jpg", caption: "언덕 위의 해" },
      // Loren Lane (MORA) · public domain · https://commons.wikimedia.org/w/index.php?curid=82195073
      { file: "joy/purple_flowers.jpg", caption: "보라빛 들꽃" },
      // NPS Photo · public domain · https://commons.wikimedia.org/w/index.php?curid=133429950
      { file: "joy/flowers_and_peak.jpg", caption: "산 아래 꽃" },
      // NPS Photo · public domain · https://commons.wikimedia.org/w/index.php?curid=114352322
      { file: "joy/green_path.jpg", caption: "풀밭의 길" },
      // Alexander Scholten · cc0 · https://commons.wikimedia.org/w/index.php?curid=155480994
      { file: "joy/sunny_meadow.jpg", caption: "햇살 든 초원" },
      // ShenandoahNPS · public domain · https://commons.wikimedia.org/w/index.php?curid=162417074
      { file: "joy/evening_meadow.jpg", caption: "저녁 노을의 들판" },
      // YellowstoneNPS · public domain · https://commons.wikimedia.org/w/index.php?curid=163833929
      { file: "joy/backlit_flowers.jpg", caption: "역광의 꽃" },
      // Joshua Tree National Park · public domain · https://commons.wikimedia.org/w/index.php?curid=161444151
      { file: "joy/desert_rainbow.jpg", caption: "사막의 무지개" },
      // Simon Schmitt helloschmitt · cc0 · https://commons.wikimedia.org/w/index.php?curid=61696756
      { file: "joy/mountain_rainbow.jpg", caption: "산 위의 무지개" },
      // Joshua Tree National Park · public domain · https://commons.wikimedia.org/w/index.php?curid=161444143
      { file: "joy/field_rainbow.jpg", caption: "들판의 무지개" },
      // Sam Ferrara · CC0 · https://commons.wikimedia.org/w/index.php?curid=58810538
      { file: "joy/peak_at_sunset.jpg", caption: "노을 진 봉우리" },
      // Great Sand Dunes National Park and Preserve · Public domain · https://commons.wikimedia.org/w/index.php?curid=110707703
      { file: "joy/alpenglow_dunes.jpg", caption: "분홍빛 산마루" },
    ],
    calm: [
      // Pseudopanax at English Wikipedia · public domain · https://commons.wikimedia.org/w/index.php?curid=74197758
      { file: "calm/mist_valley.jpg", caption: "안개 낀 골짜기" },
      // Yellowstone National Park · public domain · https://commons.wikimedia.org/w/index.php?curid=88083373
      { file: "calm/fog_plain.jpg", caption: "안개 내린 벌판" },
      // Yellowstone National Park from Yellowstone NP, USA · public domain · https://commons.wikimedia.org/w/index.php?curid=50246914
      { file: "calm/cloud_forest.jpg", caption: "구름에 잠긴 숲" },
      // Neal Herbert · public domain · https://commons.wikimedia.org/w/index.php?curid=148258941
      { file: "calm/autumn_fog.jpg", caption: "가을 안개" },
      // USFWS Mountain Prairie · public domain · https://commons.wikimedia.org/w/index.php?curid=165972938
      { file: "calm/golden_mist.jpg", caption: "황금빛 안개" },
      // USFWS Mountain Prairie · public domain · https://commons.wikimedia.org/w/index.php?curid=165972945
      { file: "calm/mist_lake.jpg", caption: "안개 내린 호수" },
      // USFWS Mountain Prairie · public domain · https://commons.wikimedia.org/w/index.php?curid=165972925
      { file: "calm/mist_trees.jpg", caption: "물안개 속의 나무" },
      // Pseudopanax at English Wikipedia · public domain · https://commons.wikimedia.org/w/index.php?curid=173861675
      { file: "calm/sun_mist_lake.jpg", caption: "해가 뜬 안개 호수" },
      // Pseudopanax at English Wikipedia · public domain · https://commons.wikimedia.org/w/index.php?curid=74197832
      { file: "calm/mirror_mountains.jpg", caption: "비친 산" },
      // Forest Service Alaska Region, USDA · public domain · https://commons.wikimedia.org/w/index.php?curid=184527427
      { file: "calm/mist_peaks.jpg", caption: "안개 낀 봉우리" },
      // Unknown authorUnknown author · cc0 · https://commons.wikimedia.org/w/index.php?curid=105649975
      { file: "calm/still_sea.jpg", caption: "잔잔한 바다" },
      // Simon Berger · CC0 · https://commons.wikimedia.org/w/index.php?curid=164250237
      { file: "calm/blue_ridges.jpg", caption: "겹겹의 푸른 능선" },
      // USFWS Mountain-Prairie · Public domain · https://commons.wikimedia.org/w/index.php?curid=69178914
      { file: "calm/foggy_sunrise_trees.jpg", caption: "안개 낀 새벽" },
      // W.carter · CC0 · https://commons.wikimedia.org/w/index.php?curid=82991013
      { file: "calm/moon_path_sea.jpg", caption: "바다에 놓인 달길" },
      // David Menke · Public domain · https://commons.wikimedia.org/w/index.php?curid=24911159
      { file: "calm/moon_snow_peak.jpg", caption: "설산의 달" },
    ],
    excited: [
      // Paul Stewart · CC0 · https://commons.wikimedia.org/w/index.php?curid=181431302
      { file: "excited/milky_way_arch.jpg", caption: "은하수의 아치" },
      // Šime Barešić · CC0 · https://commons.wikimedia.org/w/index.php?curid=93354969
      { file: "excited/milky_way_lake_glow.jpg", caption: "호수에 걸린 은하수" },
      // NPS Natural Resources · Public domain · https://commons.wikimedia.org/w/index.php?curid=110735583
      { file: "excited/crater_lake_stars.jpg", caption: "별이 잠긴 호수" },
      // Bureau of Land Management · Public domain · https://commons.wikimedia.org/w/index.php?curid=42088382
      { file: "excited/cactus_milky_way.jpg", caption: "선인장의 밤하늘" },
      // BLM Utah · Public domain · https://commons.wikimedia.org/w/index.php?curid=160329788
      { file: "excited/forest_milky_way.jpg", caption: "나무 사이 은하수" },
      // BLM Oregon & Washington · Public domain · https://commons.wikimedia.org/w/index.php?curid=160080203
      { file: "excited/milky_way_blue_arc.jpg", caption: "푸른 밤의 은하수" },
      // Joshua Tree National Park · Public domain · https://commons.wikimedia.org/w/index.php?curid=96483633
      { file: "excited/comet_and_tree.jpg", caption: "혜성이 지나는 저녁" },
      // NPS · Public domain · https://commons.wikimedia.org/w/index.php?curid=148294143
      { file: "excited/meadow_starlight.jpg", caption: "별빛 내린 초원" },
      // NASA/Bill Ingalls · Public domain · https://commons.wikimedia.org/w/index.php?curid=171618478
      { file: "excited/meteor_over_pines.jpg", caption: "별똥별의 숲" },
      // Arches National Park · Public domain · https://commons.wikimedia.org/w/index.php?curid=29670419
      { file: "excited/arch_star_trails.jpg", caption: "별이 도는 바위문" },
      // Andrew Preble · CC0 · https://commons.wikimedia.org/w/index.php?curid=61916283
      { file: "excited/cliff_star_trails.jpg", caption: "별의 궤적" },
      // U.S. Air Force/Joshua Strang · Public domain · https://commons.wikimedia.org/w/index.php?curid=1234235
      { file: "excited/aurora_snowfield.jpg", caption: "설원의 오로라" },
      // Yuliya (Pixnio) · CC0 · https://commons.wikimedia.org/w/index.php?curid=153799009
      { file: "excited/aurora_lake.jpg", caption: "오로라가 비친 호수" },
      // Johannes Groll · CC0 · https://commons.wikimedia.org/w/index.php?curid=61797653
      { file: "excited/aurora_sea.jpg", caption: "춤추는 오로라" },
      // NOAA/Ross Burgener · Public domain · https://commons.wikimedia.org/w/index.php?curid=50115994
      { file: "excited/aurora_ice.jpg", caption: "얼음을 밝힌 오로라" },
    ],
    anxious: [
      // Léon Germain Pelouse · public domain · https://commons.wikimedia.org/w/index.php?curid=103159758
      { file: "anxious/storm_field.jpg", caption: "들판 위의 먹구름" },
      // Joshua Tree National Park · public domain · https://commons.wikimedia.org/w/index.php?curid=161492233
      { file: "anxious/grey_mountains.jpg", caption: "회색빛 산" },
      // Joshua Tree National Park · public domain · https://commons.wikimedia.org/w/index.php?curid=161492014
      { file: "anxious/storm_palms.jpg", caption: "흐린 사막" },
      // Joshua Tree National Park · public domain · https://commons.wikimedia.org/w/index.php?curid=161492209
      { file: "anxious/heavy_sky.jpg", caption: "내려앉은 구름" },
      // Joshua Tree National Park · public domain · https://commons.wikimedia.org/w/index.php?curid=161492173
      { file: "anxious/storm_trees.jpg", caption: "폭풍 전의 나무" },
      // EF5 · cc0 · https://commons.wikimedia.org/w/index.php?curid=164080913
      { file: "anxious/dark_road.jpg", caption: "어두운 도로" },
      // Šime Barešić from Drage, Croatia · cc0 · https://commons.wikimedia.org/w/index.php?curid=98293677
      { file: "anxious/cloud_wall_sea.jpg", caption: "물 위의 구름벽" },
      // MONGO · public domain · https://commons.wikimedia.org/w/index.php?curid=2738250
      { file: "anxious/incoming_storm.jpg", caption: "덮친 먹구름" },
      // MONGO · public domain · https://commons.wikimedia.org/w/index.php?curid=2738185
      { file: "anxious/low_storm.jpg", caption: "낮게 깔린 구름" },
      // Staff Sgt. Matthew Plew · public domain · https://commons.wikimedia.org/w/index.php?curid=41095127
      { file: "anxious/road_storm.jpg", caption: "길 위의 구름" },
      // Merikanto · public domain · https://commons.wikimedia.org/w/index.php?curid=7166699
      { file: "anxious/bright_clouds.jpg", caption: "구름 낀 하늘" },
      // W.carter · CC0 · https://commons.wikimedia.org/w/index.php?curid=88511742
      { file: "anxious/moon_in_clouds.jpg", caption: "구름 속의 달" },
      // GlacierNPS · Public domain · https://commons.wikimedia.org/w/index.php?curid=160712735
      { file: "anxious/moon_forest_ridge.jpg", caption: "능선에 걸린 달" },
      // NOAA · Public domain · https://commons.wikimedia.org/w/index.php?curid=415487
      { file: "anxious/moonrise_bay.jpg", caption: "달 뜨는 물가" },
      // Joshua Tree National Park · public domain · https://commons.wikimedia.org/w/index.php?curid=161492220
      { file: "anxious/lone_palm_storm.jpg", caption: "외딴 나무와 구름" },
    ],
    tired: [
      // diego_torres · cc0 · https://commons.wikimedia.org/w/index.php?curid=179797588
      { file: "tired/dusk_lake.jpg", caption: "어스름한 호수" },
      // Profmarv · cc0 · https://commons.wikimedia.org/w/index.php?curid=152436652
      { file: "tired/evening_trees.jpg", caption: "저녁 나무" },
      // John Adams Parker · public domain · https://commons.wikimedia.org/w/index.php?curid=156475807
      { file: "tired/sunset_water.jpg", caption: "노을 진 물가" },
      // Sanford Robinson Gifford · public domain · https://commons.wikimedia.org/w/index.php?curid=3906582
      { file: "tired/blue_evening_peak.jpg", caption: "푸른 저녁 산" },
      // Forest Service Photography · public domain · https://commons.wikimedia.org/w/index.php?curid=185473845
      { file: "tired/low_sun_lake.jpg", caption: "해가 기우는 호수" },
      // Fwx · cc0 · https://commons.wikimedia.org/w/index.php?curid=71463304
      { file: "tired/starry_evening.jpg", caption: "별이 뜬 저녁" },
      // Byron Johnson byronism · cc0 · https://commons.wikimedia.org/w/index.php?curid=61896167
      { file: "tired/cloudy_hill.jpg", caption: "구름 낀 언덕" },
      // Netha Hussain · cc0 · https://commons.wikimedia.org/w/index.php?curid=71662173
      { file: "tired/evening_rock.jpg", caption: "저녁 바위산" },
      // Netha Hussain · cc0 · https://commons.wikimedia.org/w/index.php?curid=71662176
      { file: "tired/afterglow_ridge.jpg", caption: "해가 진 능선" },
      // Léon Bonvin · public domain · https://commons.wikimedia.org/w/index.php?curid=18843153
      { file: "tired/hazy_tree.jpg", caption: "흐린 저녁 나무" },
      // Greg Zaal · cc0 · https://commons.wikimedia.org/w/index.php?curid=148299849
      { file: "tired/dusk_hill.jpg", caption: "해 질 녘 언덕" },
      // Klaudia · cc0 · https://commons.wikimedia.org/w/index.php?curid=71414146
      { file: "tired/cloudy_valley.jpg", caption: "구름 아래 골짜기" },
      // John William Edy · public domain · https://commons.wikimedia.org/w/index.php?curid=18724193
      { file: "tired/evening_sea.jpg", caption: "잔잔한 저녁 바다" },
      // Great Sand Dunes National Park and Preserve · Public domain · https://commons.wikimedia.org/w/index.php?curid=115205803
      { file: "tired/snowy_blue_night.jpg", caption: "눈 내린 푸른 밤" },
      // NPS/Neal Herbert · Public domain · https://commons.wikimedia.org/w/index.php?curid=95209524
      { file: "tired/winter_dusk_valley.jpg", caption: "겨울 골짜기의 저녁" },
    ],
    sad: [
      // Loren Lane (MORA) · public domain · https://commons.wikimedia.org/w/index.php?curid=82254716
      { file: "sad/violet_lake.jpg", caption: "보라빛 저녁 호수" },
      // National Park Service, Alaska Region · public domain · https://commons.wikimedia.org/w/index.php?curid=110445653
      { file: "sad/shadow_ridge.jpg", caption: "그늘진 능선" },
      // YellowstoneNPS · public domain · https://commons.wikimedia.org/w/index.php?curid=163882428
      { file: "sad/grey_canyon.jpg", caption: "회색 협곡" },
      // USFWS Mountain Prairie · public domain · https://commons.wikimedia.org/w/index.php?curid=162811204
      { file: "sad/dark_plain.jpg", caption: "어두운 평원" },
      // Joshua Tree National Park · public domain · https://commons.wikimedia.org/w/index.php?curid=161494765
      { file: "sad/rain_desert.jpg", caption: "비 오는 사막" },
      // NPS Photo · public domain · https://commons.wikimedia.org/w/index.php?curid=95209584
      { file: "sad/storm_range.jpg", caption: "먹구름 산" },
      // Joshua Tree National Park · public domain · https://commons.wikimedia.org/w/index.php?curid=161494630
      { file: "sad/grey_desert_tree.jpg", caption: "회색 사막의 나무" },
      // Joshua Tree National Park · public domain · https://commons.wikimedia.org/w/index.php?curid=161494712
      { file: "sad/lone_tree.jpg", caption: "외로운 나무" },
      // W.carter · cc0 · https://commons.wikimedia.org/w/index.php?curid=67922607
      { file: "sad/bare_branches.jpg", caption: "앙상한 나뭇가지" },
      // Wilfredor · cc0 · https://commons.wikimedia.org/w/index.php?curid=127638722
      { file: "sad/fog_trees.jpg", caption: "안개 속의 나무" },
      // Aurelien Hubert aurelhubert · cc0 · https://commons.wikimedia.org/w/index.php?curid=62169833
      { file: "sad/mist_fjord.jpg", caption: "안개 낀 협곡 호수" },
      // Santa Monica Mountains National Recreation Area · public domain · https://commons.wikimedia.org/w/index.php?curid=162355030
      { file: "sad/cloud_peak.jpg", caption: "구름에 가린 산" },
      // Santa Monica Mountains National Recreation Area · public domain · https://commons.wikimedia.org/w/index.php?curid=162355073
      { file: "sad/ash_mountains.jpg", caption: "잿빛 산맥" },
      // jesse orrico jessedo81 · cc0 · https://commons.wikimedia.org/w/index.php?curid=62209630
      { file: "sad/fog_forest.jpg", caption: "안개 낀 숲" },
      // W.carter · cc0 · https://commons.wikimedia.org/w/index.php?curid=83173169
      { file: "sad/fog_lamps.jpg", caption: "안개 속 가로등" },
    ],
  };
})();
