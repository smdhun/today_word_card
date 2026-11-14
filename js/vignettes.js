/**
 * 타로 카드 맨 위에 거는 그림입니다. 은하수 사진 50장입니다.
 * Pixabay에서 받은 사진이고, Pixabay Content License로 쓸 수 있습니다.
 * 각 항목 위 주석은 올린 사람과 원본 주소입니다.
 */
(function init_vignettes() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  root.VIGNETTE_FOLDER = "images/vignettes/";

  // 여섯 기분이 같은 50장을 씁니다. 기분마다 섞는 순서는 달라집니다.
  const milky_photos = [
    // Pixabay · Venrike · https://pixabay.com/photos/sky-stars-galaxy-milky-way-night-6811874/
    { file: "milky/milky_01.jpg", caption: "은하수" },
    // Pixabay · Felix-Mittermeier · https://pixabay.com/photos/milky-way-stars-night-sky-2695569/
    { file: "milky/milky_02.jpg", caption: "은하수" },
    // Pixabay · Luminas_Art · https://pixabay.com/photos/new-year-background-galaxy-star-3608029/
    { file: "milky/milky_03.jpg", caption: "은하수" },
    // Pixabay · jplenio · https://pixabay.com/photos/ocean-milky-way-boat-sailing-3605547/
    { file: "milky/milky_04.jpg", caption: "은하수" },
    // Pixabay · Pexels · https://pixabay.com/photos/stars-sky-night-starry-sky-1845140/
    { file: "milky/milky_05.jpg", caption: "은하수" },
    // Pixabay · Kanenori · https://pixabay.com/photos/lighthouse-starry-sky-universe-6785763/
    { file: "milky/milky_06.jpg", caption: "은하수" },
    // Pixabay · theartofsounds2001 · https://pixabay.com/photos/starry-sky-milky-way-night-sky-2051448/
    { file: "milky/milky_07.jpg", caption: "은하수" },
    // Pixabay · 2780243 · https://pixabay.com/photos/moon-universe-space-milky-way-2048727/
    { file: "milky/milky_08.jpg", caption: "은하수" },
    // Pixabay · EvgeniT · https://pixabay.com/photos/starry-sky-reflections-lake-10377274/
    { file: "milky/milky_09.jpg", caption: "은하수" },
    // Pixabay · johnNaturePhotos · https://pixabay.com/photos/milky-way-sky-stars-cosmos-night-4526277/
    { file: "milky/milky_10.jpg", caption: "은하수" },
    // Pixabay · EvgeniT · https://pixabay.com/photos/night-sky-tree-field-stars-starry-6245049/
    { file: "milky/milky_11.jpg", caption: "은하수" },
    // Pixabay · Felix-Mittermeier · https://pixabay.com/photos/milky-way-stars-night-sky-2750627/
    { file: "milky/milky_12.jpg", caption: "은하수" },
    // Pixabay · ChiemSeherin · https://pixabay.com/photos/milky-way-universe-stars-night-sky-8149815/
    { file: "milky/milky_13.jpg", caption: "은하수" },
    // Pixabay · Felix-Mittermeier · https://pixabay.com/photos/milky-way-starry-sky-night-sky-star-5295160/
    { file: "milky/milky_14.jpg", caption: "은하수" },
    // Pixabay · ChiemSeherin · https://pixabay.com/photos/milky-way-universe-night-sky-galaxy-8999255/
    { file: "milky/milky_15.jpg", caption: "은하수" },
    // Pixabay · Wolfgang_Hasselmann · https://pixabay.com/photos/night-milky-way-time-warehouse-10094398/
    { file: "milky/milky_16.jpg", caption: "은하수" },
    // Pixabay · Felix-Mittermeier · https://pixabay.com/photos/starry-sky-night-sky-stars-night-2675322/
    { file: "milky/milky_17.jpg", caption: "은하수" },
    // Pixabay · vikashkr50 · https://pixabay.com/photos/milky-way-galaxy-night-stars-8153503/
    { file: "milky/milky_18.jpg", caption: "은하수" },
    // Pixabay · Pexels · https://pixabay.com/photos/stars-sky-night-starry-sky-1837306/
    { file: "milky/milky_19.jpg", caption: "은하수" },
    // Pixabay · Manuel-H · https://pixabay.com/photos/night-sky-stars-snow-trees-night-7733876/
    { file: "milky/milky_20.jpg", caption: "은하수" },
    // Pixabay · Kanenori · https://pixabay.com/photos/night-view-starry-sky-milky-way-8306605/
    { file: "milky/milky_21.jpg", caption: "은하수" },
    // Pixabay · Hans · https://pixabay.com/photos/stars-night-sky-space-galaxy-1655504/
    { file: "milky/milky_22.jpg", caption: "은하수" },
    // Pixabay · r-q · https://pixabay.com/photos/stars-milky-way-night-sky-10398079/
    { file: "milky/milky_23.jpg", caption: "은하수" },
    // Pixabay · Pexels · https://pixabay.com/photos/stars-night-sky-starry-sky-2179083/
    { file: "milky/milky_24.jpg", caption: "은하수" },
    // Pixabay · Compose_the_Seen · https://pixabay.com/photos/starry-sky-stars-night-sky-nature-10222199/
    { file: "milky/milky_25.jpg", caption: "은하수" },
    // Pixabay · Baptiste_lheurette · https://pixabay.com/photos/milky-way-sky-night-space-5422901/
    { file: "milky/milky_26.jpg", caption: "은하수" },
    // Pixabay · Pexels · https://pixabay.com/photos/cosmos-milky-way-night-sky-stars-1853491/
    { file: "milky/milky_27.jpg", caption: "은하수" },
    // Pixabay · Sinousxl · https://pixabay.com/photos/milky-way-galaxy-stars-cosmos-5905903/
    { file: "milky/milky_28.jpg", caption: "은하수" },
    // Pixabay · RonaldPlett · https://pixabay.com/photos/milkyway-stars-astrology-galaxy-8190232/
    { file: "milky/milky_29.jpg", caption: "은하수" },
    // Pixabay · Pexels · https://pixabay.com/photos/stars-sky-milky-way-galaxy-1869447/
    { file: "milky/milky_30.jpg", caption: "은하수" },
    // Pixabay · felix_merler · https://pixabay.com/photos/hike-adventure-nature-outdoors-5796976/
    { file: "milky/milky_31.jpg", caption: "은하수" },
    // Pixabay · EvgeniT · https://pixabay.com/photos/boat-lake-orion-nebula-orion-8529554/
    { file: "milky/milky_32.jpg", caption: "은하수" },
    // Pixabay · Pexels · https://pixabay.com/photos/tree-stars-night-night-sky-1866602/
    { file: "milky/milky_33.jpg", caption: "은하수" },
    // Pixabay · Walkerssk · https://pixabay.com/photos/chichen-itza-mexico-pyramid-1025099/
    { file: "milky/milky_34.jpg", caption: "은하수" },
    // Pixabay · Pexels · https://pixabay.com/photos/cosmos-milky-way-stars-night-sky-1866820/
    { file: "milky/milky_35.jpg", caption: "은하수" },
    // Pixabay · Hans · https://pixabay.com/photos/starry-sky-stars-galaxies-1655503/
    { file: "milky/milky_36.jpg", caption: "은하수" },
    // Pixabay · Pexels · https://pixabay.com/photos/stars-milky-way-night-sky-blue-sky-1869692/
    { file: "milky/milky_37.jpg", caption: "은하수" },
    // Pixabay · ColiN00B · https://pixabay.com/photos/mounthood-milky-way-lake-reflection-9733930/
    { file: "milky/milky_38.jpg", caption: "은하수" },
    // Pixabay · Kanenori · https://pixabay.com/photos/mountains-starry-sky-milky-way-8031511/
    { file: "milky/milky_39.jpg", caption: "은하수" },
    // Pixabay · jameswheeler · https://pixabay.com/photos/beautiful-blue-british-columbia-2297208/
    { file: "milky/milky_40.jpg", caption: "은하수" },
    // Pixabay · Pexels · https://pixabay.com/photos/astronomy-cosmos-dark-milky-way-1868560/
    { file: "milky/milky_41.jpg", caption: "은하수" },
    // Pixabay · ChiemSeherin · https://pixabay.com/photos/milky-way-universe-stars-night-sky-9767930/
    { file: "milky/milky_42.jpg", caption: "은하수" },
    // Pixabay · WikiImages · https://pixabay.com/photos/milky-way-space-stars-universe-67504/
    { file: "milky/milky_43.jpg", caption: "은하수" },
    // Pixabay · EvgeniT · https://pixabay.com/photos/night-milky-way-road-light-traces-5222267/
    { file: "milky/milky_44.jpg", caption: "은하수" },
    // Pixabay · Wphoto · https://pixabay.com/photos/camel-galaxy-dubai-darkness-4948299/
    { file: "milky/milky_45.jpg", caption: "은하수" },
    // Pixabay · Pexels · https://pixabay.com/photos/sky-night-galaxy-milky-way-stars-1281662/
    { file: "milky/milky_46.jpg", caption: "은하수" },
    // Pixabay · Manuel-H · https://pixabay.com/photos/trees-stars-snow-night-night-sky-7733878/
    { file: "milky/milky_47.jpg", caption: "은하수" },
    // Pixabay · Pexels · https://pixabay.com/photos/dark-milky-way-night-silhouette-1867202/
    { file: "milky/milky_48.jpg", caption: "은하수" },
    // Pixabay · StudioFriluma · https://pixabay.com/photos/milky-way-starry-sky-9859259/
    { file: "milky/milky_49.jpg", caption: "은하수" },
    // Pixabay · vikashkr50 · https://pixabay.com/photos/universe-background-astronomy-8153526/
    { file: "milky/milky_50.jpg", caption: "은하수" },
  ];

  root.VIGNETTES = {
    joy: milky_photos,
    calm: milky_photos,
    excited: milky_photos,
    anxious: milky_photos,
    tired: milky_photos,
    sad: milky_photos,
  };
})();
