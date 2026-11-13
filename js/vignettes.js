/**
 * 카드 맨 위에 거는 그림 덱입니다. 기분과 상관없이 모든 카드가 함께 씁니다.
 * 문장 덱(30개)과 장수를 맞춰서, 문장이 한 바퀴 도는 동안 그림도 겹치지 않습니다.
 *
 * 출처: Wikimedia Commons (https://commons.wikimedia.org/)
 * 퍼블릭 도메인 또는 CC0로 공개된 사진만 골라, 카드 크기(640x349)로 잘라 저장했습니다.
 * 각 항목 위의 주석은 "저작자 · 라이선스 · 원본 주소"입니다.
 */
(function init_vignettes() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  // 그림 파일이 들어 있는 폴더. 아래 file 값 앞에 붙여서 씁니다.
  root.VIGNETTE_FOLDER = "images/vignettes/";

  root.VIGNETTES = [
    // Paul Stewart · CC0 · https://commons.wikimedia.org/w/index.php?curid=181431302
    { file: "milky_way_arch.jpg", caption: "은하수의 아치" },
    // Šime Barešić · CC0 · https://commons.wikimedia.org/w/index.php?curid=93354969
    { file: "milky_way_lake_glow.jpg", caption: "호수에 걸린 은하수" },
    // NPS Natural Resources · Public domain · https://commons.wikimedia.org/w/index.php?curid=110735583
    { file: "crater_lake_stars.jpg", caption: "별이 잠긴 호수" },
    // GlacierNPS · Public domain · https://commons.wikimedia.org/w/index.php?curid=160740430
    { file: "flowers_under_stars.jpg", caption: "별 아래 핀 들꽃" },
    // NPS/Patrick Myers · Public domain · https://commons.wikimedia.org/w/index.php?curid=79102007
    { file: "snow_dunes_stars.jpg", caption: "눈 언덕의 별밤" },
    // Bureau of Land Management · Public domain · https://commons.wikimedia.org/w/index.php?curid=42088382
    { file: "cactus_milky_way.jpg", caption: "선인장의 밤하늘" },
    // Coconino National Forest · Public domain · https://commons.wikimedia.org/w/index.php?curid=75878198
    { file: "hill_trees_stars.jpg", caption: "언덕 위의 별무리" },
    // BLM Utah · Public domain · https://commons.wikimedia.org/w/index.php?curid=160329788
    { file: "forest_milky_way.jpg", caption: "나무 사이 은하수" },
    // BLM Oregon & Washington · Public domain · https://commons.wikimedia.org/w/index.php?curid=160080203
    { file: "milky_way_blue_arc.jpg", caption: "푸른 밤의 은하수" },
    // Bureau of Land Management (mypubliclands) · Public domain · https://commons.wikimedia.org/w/index.php?curid=161633223
    { file: "canyon_river_stars.jpg", caption: "협곡을 흐르는 밤" },
    // Joshua Tree National Park · Public domain · https://commons.wikimedia.org/w/index.php?curid=96483633
    { file: "comet_and_tree.jpg", caption: "혜성이 지나는 저녁" },
    // NPS · Public domain · https://commons.wikimedia.org/w/index.php?curid=148294143
    { file: "meadow_starlight.jpg", caption: "별빛 내린 초원" },
    // NASA/Bill Ingalls · Public domain · https://commons.wikimedia.org/w/index.php?curid=171618478
    { file: "meteor_over_pines.jpg", caption: "별똥별의 숲" },
    // Arches National Park · Public domain · https://commons.wikimedia.org/w/index.php?curid=29670419
    { file: "arch_star_trails.jpg", caption: "별이 도는 바위문" },
    // Andrew Preble · CC0 · https://commons.wikimedia.org/w/index.php?curid=61916283
    { file: "cliff_star_trails.jpg", caption: "별의 궤적" },
    // U.S. Air Force/Joshua Strang · Public domain · https://commons.wikimedia.org/w/index.php?curid=1234235
    { file: "aurora_snowfield.jpg", caption: "설원의 오로라" },
    // Yuliya (Pixnio) · CC0 · https://commons.wikimedia.org/w/index.php?curid=153799009
    { file: "aurora_lake.jpg", caption: "오로라가 비친 호수" },
    // Johannes Groll · CC0 · https://commons.wikimedia.org/w/index.php?curid=61797653
    { file: "aurora_sea.jpg", caption: "춤추는 오로라" },
    // NOAA/Ross Burgener · Public domain · https://commons.wikimedia.org/w/index.php?curid=50115994
    { file: "aurora_ice.jpg", caption: "얼음을 밝힌 오로라" },
    // David Menke · Public domain · https://commons.wikimedia.org/w/index.php?curid=24911159
    { file: "moon_snow_peak.jpg", caption: "설산의 달" },
    // NOAA · Public domain · https://commons.wikimedia.org/w/index.php?curid=415487
    { file: "moonrise_bay.jpg", caption: "달 뜨는 물가" },
    // W.carter · CC0 · https://commons.wikimedia.org/w/index.php?curid=82991013
    { file: "moon_path_sea.jpg", caption: "바다에 놓인 달길" },
    // GlacierNPS · Public domain · https://commons.wikimedia.org/w/index.php?curid=160712735
    { file: "moon_forest_ridge.jpg", caption: "능선에 걸린 달" },
    // W.carter · CC0 · https://commons.wikimedia.org/w/index.php?curid=88511742
    { file: "moon_in_clouds.jpg", caption: "구름 속의 달" },
    // USFWS Mountain-Prairie · Public domain · https://commons.wikimedia.org/w/index.php?curid=69178914
    { file: "foggy_sunrise_trees.jpg", caption: "안개 낀 새벽" },
    // Simon Berger · CC0 · https://commons.wikimedia.org/w/index.php?curid=164250237
    { file: "blue_ridges.jpg", caption: "겹겹의 푸른 능선" },
    // Sam Ferrara · CC0 · https://commons.wikimedia.org/w/index.php?curid=58810538
    { file: "peak_at_sunset.jpg", caption: "노을 진 봉우리" },
    // Great Sand Dunes National Park and Preserve · Public domain · https://commons.wikimedia.org/w/index.php?curid=110707703
    { file: "alpenglow_dunes.jpg", caption: "분홍빛 산마루" },
    // Great Sand Dunes National Park and Preserve · Public domain · https://commons.wikimedia.org/w/index.php?curid=115205803
    { file: "snowy_blue_night.jpg", caption: "눈 내린 푸른 밤" },
    // NPS/Neal Herbert · Public domain · https://commons.wikimedia.org/w/index.php?curid=95209524
    { file: "winter_dusk_valley.jpg", caption: "겨울 골짜기의 저녁" },
  ];
})();
