/**
 * 타로 카드 맨 위에 거는 그림입니다. 강아지 50장, 고양이 50장입니다.
 * Pixabay에서 받은 사진이고, Pixabay Content License로 쓸 수 있습니다.
 * 각 항목 위 주석은 올린 사람과 원본 주소입니다.
 */
(function init_vignettes() {
  const root = (window.TodayWordCard = window.TodayWordCard || {});

  root.VIGNETTE_FOLDER = "images/vignettes/";

  // 여섯 기분이 같은 100장을 씁니다. 기분마다 섞는 순서는 달라집니다.
  const animal_photos = [
    // Pixabay · Winsker · https://pixabay.com/photos/dog-puppy-pet-black-dog-animal-423398/
    { file: "dogs/dog_01.jpg", caption: "귀여운 강아지" },
    // Pixabay · 3194556 · https://pixabay.com/photos/puppy-dog-pet-collar-dog-collar-1903313/
    { file: "dogs/dog_02.jpg", caption: "귀여운 강아지" },
    // Pixabay · Beatriz57 · https://pixabay.com/photos/dog-pet-animal-bernese-mountain-dog-287420/
    { file: "dogs/dog_03.jpg", caption: "귀여운 강아지" },
    // Pixabay · lauralucia · https://pixabay.com/photos/puppy-dog-pet-canine-animal-fur-4234435/
    { file: "dogs/dog_04.jpg", caption: "귀여운 강아지" },
    // Pixabay · Chiemsee2024 · https://pixabay.com/photos/labrador-retriever-dog-pet-1210559/
    { file: "dogs/dog_05.jpg", caption: "귀여운 강아지" },
    // Pixabay · Chiemsee2024 · https://pixabay.com/photos/puppy-golden-retriever-dog-young-1207816/
    { file: "dogs/dog_06.jpg", caption: "귀여운 강아지" },
    // Pixabay · salofoto · https://pixabay.com/photos/dog-animal-mammal-canine-domestic-9478487/
    { file: "dogs/dog_07.jpg", caption: "귀여운 강아지" },
    // Pixabay · zoegammon · https://pixabay.com/photos/puppy-yorkie-dog-pet-canine-4608266/
    { file: "dogs/dog_08.jpg", caption: "귀여운 강아지" },
    // Pixabay · RebeccasPictures · https://pixabay.com/photos/australian-shepherd-dog-snow-5902417/
    { file: "dogs/dog_09.jpg", caption: "귀여운 강아지" },
    // Pixabay · RebeccasPictures · https://pixabay.com/photos/dog-pet-pet-owner-animal-owner-5753302/
    { file: "dogs/dog_10.jpg", caption: "귀여운 강아지" },
    // Pixabay · Pezibear · https://pixabay.com/photos/yorkshire-terrier-dog-pet-yorkie-4783327/
    { file: "dogs/dog_11.jpg", caption: "귀여운 강아지" },
    // Pixabay · MolnarSzabolcsErdely · https://pixabay.com/photos/dog-pet-corgi-canine-animal-lying-6389277/
    { file: "dogs/dog_12.jpg", caption: "귀여운 강아지" },
    // Pixabay · JACLOU-DL · https://pixabay.com/photos/havanese-dog-canine-dog-9486395/
    { file: "dogs/dog_13.jpg", caption: "귀여운 강아지" },
    // Pixabay · jerueck · https://pixabay.com/photos/australian-shepherd-australia-friend-7664795/
    { file: "dogs/dog_14.jpg", caption: "귀여운 강아지" },
    // Pixabay · salofoto · https://pixabay.com/photos/dog-animal-mammal-run-canine-9478504/
    { file: "dogs/dog_15.jpg", caption: "귀여운 강아지" },
    // Pixabay · RonaldPlett · https://pixabay.com/photos/jack-russell-puppy-mammal-dog-8379770/
    { file: "dogs/dog_16.jpg", caption: "귀여운 강아지" },
    // Pixabay · yamabon · https://pixabay.com/photos/animal-flowers-dog-outdoors-canine-6637774/
    { file: "dogs/dog_17.jpg", caption: "귀여운 강아지" },
    // Pixabay · Jackielsy · https://pixabay.com/photos/dog-animal-puppy-cute-shiba-9830831/
    { file: "dogs/dog_18.jpg", caption: "귀여운 강아지" },
    // Pixabay · jatocreate · https://pixabay.com/photos/labrador-retriever-dog-head-puppy-6158095/
    { file: "dogs/dog_19.jpg", caption: "귀여운 강아지" },
    // Pixabay · Andre-H · https://pixabay.com/photos/dog-puppy-pet-golden-retriever-5632005/
    { file: "dogs/dog_20.jpg", caption: "귀여운 강아지" },
    // Pixabay · Pexels · https://pixabay.com/photos/pet-dog-puppy-sad-eyes-animal-1284307/
    { file: "dogs/dog_21.jpg", caption: "귀여운 강아지" },
    // Pixabay · Edyttka1388 · https://pixabay.com/photos/puppy-outdoors-dog-stick-animal-7543571/
    { file: "dogs/dog_22.jpg", caption: "귀여운 강아지" },
    // Pixabay · HuyNgan · https://pixabay.com/photos/dog-puppy-cute-animal-young-animal-5849152/
    { file: "dogs/dog_23.jpg", caption: "귀여운 강아지" },
    // Pixabay · JACLOU-DL · https://pixabay.com/photos/shetland-sheepdog-dog-animal-mammal-8420917/
    { file: "dogs/dog_24.jpg", caption: "귀여운 강아지" },
    // Pixabay · PicsbyFran · https://pixabay.com/photos/shih-tzu-dog-pet-animal-sleeping-8287355/
    { file: "dogs/dog_25.jpg", caption: "귀여운 강아지" },
    // Pixabay · aiamkay · https://pixabay.com/photos/boxer-dog-animal-pet-canine-cute-8207572/
    { file: "dogs/dog_26.jpg", caption: "귀여운 강아지" },
    // Pixabay · a-mblomma · https://pixabay.com/photos/chihuahua-dog-pet-animal-453063/
    { file: "dogs/dog_27.jpg", caption: "귀여운 강아지" },
    // Pixabay · RebaSpike · https://pixabay.com/photos/dachshund-dog-pet-animal-domestic-8043109/
    { file: "dogs/dog_28.jpg", caption: "귀여운 강아지" },
    // Pixabay · vlaaitje · https://pixabay.com/photos/puppy-dog-pet-cute-brown-dog-1047521/
    { file: "dogs/dog_29.jpg", caption: "귀여운 강아지" },
    // Pixabay · huoadg5888 · https://pixabay.com/photos/pets-cat-dog-animals-mammals-3715733/
    { file: "dogs/dog_30.jpg", caption: "귀여운 강아지" },
    // Pixabay · huoadg5888 · https://pixabay.com/photos/corgi-dog-pet-canine-rain-animal-4415649/
    { file: "dogs/dog_31.jpg", caption: "귀여운 강아지" },
    // Pixabay · Pexels · https://pixabay.com/photos/beach-dog-pet-puppy-canine-mammal-1854121/
    { file: "dogs/dog_32.jpg", caption: "귀여운 강아지" },
    // Pixabay · JACLOU-DL · https://pixabay.com/photos/puppy-golden-retriever-10388991/
    { file: "dogs/dog_33.jpg", caption: "귀여운 강아지" },
    // Pixabay · 27058054 · https://pixabay.com/photos/puppy-bernese-mountain-dog-beach-7162203/
    { file: "dogs/dog_34.jpg", caption: "귀여운 강아지" },
    // Pixabay · StockSnap · https://pixabay.com/photos/dog-cat-pets-mammals-animals-2606759/
    { file: "dogs/dog_35.jpg", caption: "귀여운 강아지" },
    // Pixabay · garten-gg · https://pixabay.com/photos/animals-dogs-cats-kittens-puppies-2222007/
    { file: "dogs/dog_36.jpg", caption: "귀여운 강아지" },
    // Pixabay · Pezibear · https://pixabay.com/photos/maltese-dog-puppy-small-dog-1123016/
    { file: "dogs/dog_37.jpg", caption: "귀여운 강아지" },
    // Pixabay · GumiKutya · https://pixabay.com/photos/pet-dog-adopted-adoption-animal-10072662/
    { file: "dogs/dog_38.jpg", caption: "귀여운 강아지" },
    // Pixabay · moshehar · https://pixabay.com/photos/dog-cute-animal-pet-puppy-looking-3071334/
    { file: "dogs/dog_39.jpg", caption: "귀여운 강아지" },
    // Pixabay · 8777334 · https://pixabay.com/photos/dog-adorable-animal-cute-happiness-3344414/
    { file: "dogs/dog_40.jpg", caption: "귀여운 강아지" },
    // Pixabay · vlaaitje · https://pixabay.com/photos/bulldog-dog-puppy-pet-black-dog-1047518/
    { file: "dogs/dog_41.jpg", caption: "귀여운 강아지" },
    // Pixabay · Vizslafotozas · https://pixabay.com/photos/dog-pet-canine-animal-fur-snout-3277416/
    { file: "dogs/dog_42.jpg", caption: "귀여운 강아지" },
    // Pixabay · angel1238812 · https://pixabay.com/photos/dog-pet-canine-animal-fur-snout-4633734/
    { file: "dogs/dog_43.jpg", caption: "귀여운 강아지" },
    // Pixabay · AlešHáva · https://pixabay.com/photos/dog-animal-puppy-cute-young-male-5357794/
    { file: "dogs/dog_44.jpg", caption: "귀여운 강아지" },
    // Pixabay · whitedaemon · https://pixabay.com/photos/bulldog-dog-pet-animal-1224267/
    { file: "dogs/dog_45.jpg", caption: "귀여운 강아지" },
    // Pixabay · Pexels · https://pixabay.com/photos/dog-pet-collar-dog-collar-domestic-2178696/
    { file: "dogs/dog_46.jpg", caption: "귀여운 강아지" },
    // Pixabay · PicsbyFran · https://pixabay.com/photos/puppy-pet-canine-dog-animal-lying-2785074/
    { file: "dogs/dog_47.jpg", caption: "귀여운 강아지" },
    // Pixabay · Jackielsy · https://pixabay.com/photos/dog-animal-puppy-cute-shiba-9830813/
    { file: "dogs/dog_48.jpg", caption: "귀여운 강아지" },
    // Pixabay · Clth20 · https://pixabay.com/photos/weimaraner-puppy-dog-snout-1381186/
    { file: "dogs/dog_49.jpg", caption: "귀여운 강아지" },
    // Pixabay · Maddin_1983 · https://pixabay.com/photos/dog-canine-face-domestic-look-pet-7185274/
    { file: "dogs/dog_50.jpg", caption: "귀여운 강아지" },
    // Pixabay · AyşegülAytören · https://pixabay.com/photos/cat-animal-nature-mammal-cute-fur-10407613/
    { file: "cats/cat_01.jpg", caption: "귀여운 고양이" },
    // Pixabay · Nennieinszweidrei · https://pixabay.com/photos/cat-eyes-european-shorthair-cat-6838073/
    { file: "cats/cat_02.jpg", caption: "귀여운 고양이" },
    // Pixabay · Ben_Kerckx · https://pixabay.com/photos/cat-pet-animal-tabby-cat-300572/
    { file: "cats/cat_03.jpg", caption: "귀여운 고양이" },
    // Pixabay · pfreedom · https://pixabay.com/photos/cat-animal-mammal-feline-domestic-9389500/
    { file: "cats/cat_04.jpg", caption: "귀여운 고양이" },
    // Pixabay · guvo59 · https://pixabay.com/photos/kitten-cat-pet-feline-animal-fur-4611189/
    { file: "cats/cat_05.jpg", caption: "귀여운 고양이" },
    // Pixabay · maminounou · https://pixabay.com/photos/animal-cat-mammal-feline-pet-7901464/
    { file: "cats/cat_06.jpg", caption: "귀여운 고양이" },
    // Pixabay · ClaudiaWollesen · https://pixabay.com/photos/maine-coon-cat-cats-eyes-black-cat-694730/
    { file: "cats/cat_07.jpg", caption: "귀여운 고양이" },
    // Pixabay · jscreativelab · https://pixabay.com/photos/simba-cat-portrait-cat-photography-8618301/
    { file: "cats/cat_08.jpg", caption: "귀여운 고양이" },
    // Pixabay · MabelAmber · https://pixabay.com/photos/cat-pet-feline-animal-fur-3591348/
    { file: "cats/cat_09.jpg", caption: "귀여운 고양이" },
    // Pixabay · IlonaBurschl · https://pixabay.com/photos/kitty-playful-flowers-wildflowers-2948404/
    { file: "cats/cat_10.jpg", caption: "귀여운 고양이" },
    // Pixabay · guvo59 · https://pixabay.com/photos/european-shorthair-cat-kitten-8267220/
    { file: "cats/cat_11.jpg", caption: "귀여운 고양이" },
    // Pixabay · Miller_Eszter · https://pixabay.com/photos/cat-pet-feline-black-cat-animal-3739702/
    { file: "cats/cat_12.jpg", caption: "귀여운 고양이" },
    // Pixabay · cocoparisienne · https://pixabay.com/photos/cat-animal-cat-portrait-cats-eyes-1045782/
    { file: "cats/cat_13.jpg", caption: "귀여운 고양이" },
    // Pixabay · Kessa · https://pixabay.com/photos/cat-kitten-tree-curious-tabby-1647775/
    { file: "cats/cat_14.jpg", caption: "귀여운 고양이" },
    // Pixabay · Irenna_____ · https://pixabay.com/photos/cat-pet-feline-animal-fur-kitty-7274205/
    { file: "cats/cat_15.jpg", caption: "귀여운 고양이" },
    // Pixabay · TeamK · https://pixabay.com/photos/cat-pet-licking-animal-tabby-cat-323262/
    { file: "cats/cat_16.jpg", caption: "귀여운 고양이" },
    // Pixabay · miezekieze · https://pixabay.com/photos/cat-pet-animal-tabby-cat-5618328/
    { file: "cats/cat_17.jpg", caption: "귀여운 고양이" },
    // Pixabay · eduardovieiraphoto · https://pixabay.com/photos/cat-kitten-pet-black-cat-kitty-5233986/
    { file: "cats/cat_18.jpg", caption: "귀여운 고양이" },
    // Pixabay · Felix-Mittermeier · https://pixabay.com/photos/siamese-cat-cat-pet-kitten-animal-5320568/
    { file: "cats/cat_19.jpg", caption: "귀여운 고양이" },
    // Pixabay · trungm499 · https://pixabay.com/photos/cat-kitten-snow-white-cat-pet-6578336/
    { file: "cats/cat_20.jpg", caption: "귀여운 고양이" },
    // Pixabay · cocoparisienne · https://pixabay.com/photos/cat-tabby-face-whiskers-pet-1508613/
    { file: "cats/cat_21.jpg", caption: "귀여운 고양이" },
    // Pixabay · rwgusev · https://pixabay.com/photos/cat-mammal-eyes-animal-wild-7866716/
    { file: "cats/cat_22.jpg", caption: "귀여운 고양이" },
    // Pixabay · STVIOD · https://pixabay.com/photos/cat-pet-animal-ginger-cat-67345/
    { file: "cats/cat_23.jpg", caption: "귀여운 고양이" },
    // Pixabay · Leuchtturm81 · https://pixabay.com/photos/cat-black-cat-animal-pet-5579221/
    { file: "cats/cat_24.jpg", caption: "귀여운 고양이" },
    // Pixabay · guvo59 · https://pixabay.com/photos/european-shorthair-cat-animal-8601492/
    { file: "cats/cat_25.jpg", caption: "귀여운 고양이" },
    // Pixabay · amayaeguizabal · https://pixabay.com/photos/cat-pet-animal-tabby-cat-468232/
    { file: "cats/cat_26.jpg", caption: "귀여운 고양이" },
    // Pixabay · bongbabyhousevn · https://pixabay.com/photos/cat-kitten-pet-lick-tongue-6723256/
    { file: "cats/cat_27.jpg", caption: "귀여운 고양이" },
    // Pixabay · Alexas_Fotos · https://pixabay.com/photos/cat-face-eyes-portrait-1455468/
    { file: "cats/cat_28.jpg", caption: "귀여운 고양이" },
    // Pixabay · birgl · https://pixabay.com/photos/cat-animal-mammal-feline-domestic-9355075/
    { file: "cats/cat_29.jpg", caption: "귀여운 고양이" },
    // Pixabay · alllessandro_ · https://pixabay.com/photos/cat-grey-cat-animal-feline-pet-8197577/
    { file: "cats/cat_30.jpg", caption: "귀여운 고양이" },
    // Pixabay · Netti_Nu_Nu · https://pixabay.com/photos/cat-pet-black-cat-animal-feline-6342145/
    { file: "cats/cat_31.jpg", caption: "귀여운 고양이" },
    // Pixabay · Pexels · https://pixabay.com/photos/kitten-white-cat-cute-domestic-1285341/
    { file: "cats/cat_32.jpg", caption: "귀여운 고양이" },
    // Pixabay · Pexels · https://pixabay.com/photos/cat-kitten-feline-pet-lying-down-1282309/
    { file: "cats/cat_33.jpg", caption: "귀여운 고양이" },
    // Pixabay · JoeSang · https://pixabay.com/photos/cat-pet-animal-tabby-cat-360807/
    { file: "cats/cat_34.jpg", caption: "귀여운 고양이" },
    // Pixabay · MabelAmber · https://pixabay.com/photos/cat-pet-feline-animal-fur-3745065/
    { file: "cats/cat_35.jpg", caption: "귀여운 고양이" },
    // Pixabay · xiclography · https://pixabay.com/photos/cat-pet-animal-black-cat-domestic-4541889/
    { file: "cats/cat_36.jpg", caption: "귀여운 고양이" },
    // Pixabay · dexmac · https://pixabay.com/photos/cat-pet-yawn-animal-domestic-cat-4218424/
    { file: "cats/cat_37.jpg", caption: "귀여운 고양이" },
    // Pixabay · guvo59 · https://pixabay.com/photos/european-shorthair-cat-kitten-pet-8136065/
    { file: "cats/cat_38.jpg", caption: "귀여운 고양이" },
    // Pixabay · Pexels · https://pixabay.com/photos/cat-sleepy-tired-asleep-tabby-1870003/
    { file: "cats/cat_39.jpg", caption: "귀여운 고양이" },
    // Pixabay · Nennieinszweidrei · https://pixabay.com/photos/tomcat-cat-domestic-cat-pet-8769861/
    { file: "cats/cat_40.jpg", caption: "귀여운 고양이" },
    // Pixabay · Alexsios · https://pixabay.com/photos/cat-mammal-animal-black-cat-8124039/
    { file: "cats/cat_41.jpg", caption: "귀여운 고양이" },
    // Pixabay · Missingstripy · https://pixabay.com/photos/cat-feline-pet-animal-outdoors-6960183/
    { file: "cats/cat_42.jpg", caption: "귀여운 고양이" },
    // Pixabay · Chiemsee2024 · https://pixabay.com/photos/cat-kitten-pet-striped-young-1192026/
    { file: "cats/cat_43.jpg", caption: "귀여운 고양이" },
    // Pixabay · webandi · https://pixabay.com/photos/cat-siamese-cat-fur-kitten-2068462/
    { file: "cats/cat_44.jpg", caption: "귀여운 고양이" },
    // Pixabay · Uschi_Du · https://pixabay.com/photos/cat-domestic-animal-animal-gray-3261420/
    { file: "cats/cat_45.jpg", caption: "귀여운 고양이" },
    // Pixabay · mermaidtoon · https://pixabay.com/photos/cat-pet-feline-animal-fur-kitty-4097325/
    { file: "cats/cat_46.jpg", caption: "귀여운 고양이" },
    // Pixabay · jonathansautter · https://pixabay.com/photos/cat-tired-yawn-stretch-814952/
    { file: "cats/cat_47.jpg", caption: "귀여운 고양이" },
    // Pixabay · susannp4 · https://pixabay.com/photos/kittens-felines-pets-young-animals-2273598/
    { file: "cats/cat_48.jpg", caption: "귀여운 고양이" },
    // Pixabay · SZ-Art_de · https://pixabay.com/photos/cat-red-tomcat-cat-face-5496162/
    { file: "cats/cat_49.jpg", caption: "귀여운 고양이" },
    // Pixabay · 1899441 · https://pixabay.com/photos/cat-pet-animal-face-whiskers-fur-1151519/
    { file: "cats/cat_50.jpg", caption: "귀여운 고양이" },
  ];

  root.VIGNETTES = {
    joy: animal_photos,
    calm: animal_photos,
    excited: animal_photos,
    anxious: animal_photos,
    tired: animal_photos,
    sad: animal_photos,
  };
})();
