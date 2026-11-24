/* Demo corpus: fictional company "Zhaiyk Coatings". All lines are [en, ru, kk] triples. */
export const CORPUS = (() => {
  const DOCS = [
    { id: 'cat',   name: 'Product_Catalog_2025.pdf',            type: 'pdf',  size: 2516582, ago: 612, pages: 8,  cat: ['Product catalog','Каталог продукции','Өнім каталогы'] },
    { id: 'price', name: 'Price_List_2026.xlsx',                type: 'xlsx', size: 49152,   ago: 312, sheets: 3, cat: ['Price list','Прайс-лист','Баға тізімі'] },
    { id: 'spec',  name: 'Technical_Specifications.pdf',        type: 'pdf',  size: 1153434, ago: 290, pages: 14, cat: ['Technical documentation','Техническая документация','Техникалық құжаттама'] },
    { id: 'comp',  name: 'Compatibility_Matrix.csv',            type: 'csv',  size: 3072,    ago: 290, rows: 15,  cat: ['Compatibility table','Таблица совместимости','Үйлесімділік кестесі'] },
    { id: 'deliv', name: 'Delivery_Policy.docx',                type: 'docx', size: 38912,   ago: 365, cat: ['Policy','Политика','Саясат'] },
    { id: 'warr',  name: 'Warranty_and_Returns_Policy.docx',    type: 'docx', size: 53248,   ago: 319, cat: ['Policy','Политика','Саясат'] },
    { id: 'faq',   name: 'Internal_FAQ.txt',                    type: 'txt',  size: 6144,    ago: 80,  cat: ['Internal FAQ','Внутренний FAQ','Ішкі FAQ'] },
  ];

  // loc: {page}|{sheet,rows}|{section}|{rows}|{lines}
  const CHUNKS = [
    { id: 'cat1', doc: 'cat', loc: { page: 2 }, topic: 'specs', lines: [
      ['TerraShield X5 is an exterior acrylic facade paint for concrete, mineral plaster and brick.','TerraShield X5 — акриловая фасадная краска для бетона, минеральной штукатурки и кирпича.','TerraShield X5 — бетонға, минералды сылаққа және кірпішке арналған акрилді қасбет бояуы.'],
      ['Pack size: 10 L. Catalog price (2025 edition): 40,900 ₸ per 10 L pack.','Фасовка: 10 л. Цена по каталогу (издание 2025 г.): 40 900 ₸ за упаковку 10 л.','Қаптама: 10 л. Каталог бағасы (2025 жылғы басылым): 10 л қаптама үшін 40 900 ₸.'],
      ['Resistant to UV, rain and temperature swings from −40 °C to +60 °C.','Устойчива к УФ-излучению, дождю и перепадам температур от −40 °C до +60 °C.','Ультракүлгін сәулеге, жаңбырға және −40 °C-тан +60 °C-қа дейінгі температура ауытқуына төзімді.'] ] },
    { id: 'cat2', doc: 'cat', loc: { page: 3 }, topic: 'specs', lines: [
      ['SilkWall Interior Matt is a washable matt paint for interior walls and ceilings.','SilkWall Interior Matt — моющаяся матовая краска для стен и потолков внутри помещений.','SilkWall Interior Matt — үй ішіндегі қабырғалар мен төбелерге арналған жуылатын күңгірт бояу.'],
      ['Suitable for plaster, drywall and concrete. Pack size: 9 L.','Подходит для штукатурки, гипсокартона и бетона. Фасовка: 9 л.','Сылаққа, гипсокартонға және бетонға жарамды. Қаптама: 9 л.'],
      ['Wet-scrub resistance class 2; not intended for permanently wet areas.','Класс устойчивости к влажному истиранию 2; не предназначена для постоянно влажных зон.','Ылғалды ысқылауға төзімділік сыныбы 2; тұрақты ылғалды аймақтарға арналмаған.'] ] },
    { id: 'cat3', doc: 'cat', loc: { page: 4 }, topic: 'specs', lines: [
      ['MetalGuard 3-in-1 is an anti-corrosion enamel for steel and iron: primer, rust converter and topcoat in one product.','MetalGuard 3-in-1 — антикоррозионная эмаль по стали и железу: грунт, преобразователь ржавчины и финишное покрытие в одном продукте.','MetalGuard 3-in-1 — болат пен темірге арналған тоттануға қарсы эмаль: бір өнімде грунт, тот түрлендіргіш және соңғы қабат.'],
      ['Can be applied directly onto surfaces with firmly bonded rust. Pack size: 2.5 L.','Наносится непосредственно на поверхности с плотно сцепленной ржавчиной. Фасовка: 2,5 л.','Мықтап жабысқан тот бар беттерге тікелей жағуға болады. Қаптама: 2,5 л.'] ] },
    { id: 'cat4', doc: 'cat', loc: { page: 5 }, topic: 'specs', lines: [
      ['WoodCare Lasur is a protective translucent glaze for interior and exterior wood.','WoodCare Lasur — защитная прозрачная лазурь для древесины снаружи и внутри помещений.','WoodCare Lasur — ағашқа арналған, сырт пен ішке жарамды қорғаныш мөлдір лазурь.'],
      ['Protects against moisture, UV and biological damage. Pack size: 2.5 L.','Защищает от влаги, УФ-излучения и биологического поражения. Фасовка: 2,5 л.','Ылғалдан, ультракүлгін сәуледен және биологиялық зақымданудан қорғайды. Қаптама: 2,5 л.'] ] },
    { id: 'cat5', doc: 'cat', loc: { page: 6 }, topic: 'specs', lines: [
      ['AquaPrime 100 is a water-based acrylic primer for concrete, plaster and drywall; it improves adhesion and evens out absorption.','AquaPrime 100 — акриловый грунт на водной основе для бетона, штукатурки и гипсокартона; улучшает адгезию и выравнивает впитывание.','AquaPrime 100 — бетонға, сылаққа және гипсокартонға арналған су негізіндегі акрилді грунт; адгезияны жақсартып, сіңуді теңестіреді.'],
      ['FlexSeal is a flexible one-component waterproofing coating for bathrooms, balconies and basements. Pack size: 5 kg.','FlexSeal — эластичное однокомпонентное гидроизоляционное покрытие для ванных комнат, балконов и подвалов. Фасовка: 5 кг.','FlexSeal — жуынатын бөлмелерге, балкондар мен жертөлелерге арналған икемді бір құрамды гидроизоляциялық жабын. Қаптама: 5 кг.'] ] },

    { id: 'price1', doc: 'price', loc: { sheet: 'Prices 2026', rows: '2–4' }, topic: 'pricing', lines: [
      ['TerraShield X5, 10 L — 42,800 ₸','TerraShield X5, 10 л — 42 800 ₸','TerraShield X5, 10 л — 42 800 ₸'],
      ['SilkWall Interior Matt, 9 L — 27,900 ₸','SilkWall Interior Matt, 9 л — 27 900 ₸','SilkWall Interior Matt, 9 л — 27 900 ₸'],
      ['AquaPrime 100, 10 L — 14,500 ₸','AquaPrime 100, 10 л — 14 500 ₸','AquaPrime 100, 10 л — 14 500 ₸'] ] },
    { id: 'price2', doc: 'price', loc: { sheet: 'Prices 2026', rows: '5–9' }, topic: 'pricing', lines: [
      ['MetalGuard 3-in-1, 2.5 L — 19,600 ₸','MetalGuard 3-in-1, 2,5 л — 19 600 ₸','MetalGuard 3-in-1, 2,5 л — 19 600 ₸'],
      ['WoodCare Lasur, 2.5 L — 16,900 ₸','WoodCare Lasur, 2,5 л — 16 900 ₸','WoodCare Lasur, 2,5 л — 16 900 ₸'],
      ['FlexSeal, 5 kg — 21,400 ₸','FlexSeal, 5 кг — 21 400 ₸','FlexSeal, 5 кг — 21 400 ₸'],
      ['All prices include VAT 12% and are valid until 31 December 2026.','Все цены включают НДС 12% и действуют до 31 декабря 2026 г.','Барлық бағаларға ҚҚС 12% кіреді және 2026 жылғы 31 желтоқсанға дейін жарамды.'] ] },
    { id: 'price3', doc: 'price', loc: { sheet: 'Discounts', rows: '2–5' }, topic: 'discounts', lines: [
      ['Order total from 300,000 ₸: 5% discount.','Сумма заказа от 300 000 ₸: скидка 5%.','Тапсырыс сомасы 300 000 ₸-ден: 5% жеңілдік.'],
      ['Order total from 1,000,000 ₸: 10% discount.','Сумма заказа от 1 000 000 ₸: скидка 10%.','Тапсырыс сомасы 1 000 000 ₸-ден: 10% жеңілдік.'],
      ['Registered contractors with a partner card: 7% discount.','Зарегистрированные подрядчики с партнёрской картой: скидка 7%.','Серіктес картасы бар тіркелген мердігерлер: 7% жеңілдік.'],
      ['Discounts do not stack: the single highest applicable discount is applied.','Скидки не суммируются: применяется одна наибольшая из подходящих.','Жеңілдіктер қосылмайды: қолданылатындардың ішінен ең үлкені ғана беріледі.'] ] },
    { id: 'price4', doc: 'price', loc: { sheet: 'Services', rows: '2–3' }, topic: 'pricing', lines: [
      ['Tinting service: 1,500 ₸ per can.','Услуга колеровки: 1 500 ₸ за банку.','Бояуды түстеу қызметі: бір банкаға 1 500 ₸.'],
      ['Delivery within Almaty is charged separately according to the Delivery Policy.','Доставка по Алматы оплачивается отдельно согласно Политике доставки.','Алматы бойынша жеткізу Жеткізу саясатына сәйкес бөлек төленеді.'] ] },

    { id: 'spec1', doc: 'spec', loc: { page: 2 }, topic: 'specs', lines: [
      ['TerraShield X5 coverage: 7–9 m² per litre per coat; one 10 L pack covers about 70–90 m² per coat.','Расход TerraShield X5: 7–9 м² на литр на один слой; упаковка 10 л покрывает около 70–90 м² на слой.','TerraShield X5 жабу ауданы: бір қабатта литріне 7–9 м²; 10 л қаптама бір қабатта шамамен 70–90 м² жабады.'],
      ['Recommended: 2 coats. Dry to touch: 2 hours. Recoat after 4 hours.','Рекомендуется 2 слоя. Высыхание на отлип: 2 часа. Повторное нанесение через 4 часа.','Ұсынылады: 2 қабат. Қолға жабыспауы: 2 сағат. Келесі қабат 4 сағаттан кейін жағылады.'],
      ['Application temperature: +5 °C to +35 °C. Apply by roller, brush or airless sprayer. Dilute with water up to 5%.','Температура нанесения: от +5 °C до +35 °C. Наносить валиком, кистью или безвоздушным распылителем. Разбавлять водой до 5%.','Жағу температурасы: +5 °C-тан +35 °C-қа дейін. Біліктің, қылқаламның немесе ауасыз бүріккіштің көмегімен жағылады. Сумен 5%-ға дейін сұйылтуға болады.'] ] },
    { id: 'spec2', doc: 'spec', loc: { page: 3 }, topic: 'specs', lines: [
      ['SilkWall Interior Matt coverage: 9–11 m² per litre per coat; one 9 L pack covers about 81–99 m².','Расход SilkWall Interior Matt: 9–11 м² на литр на слой; упаковка 9 л покрывает около 81–99 м².','SilkWall Interior Matt жабу ауданы: бір қабатта литріне 9–11 м²; 9 л қаптама шамамен 81–99 м² жабады.'],
      ['Recommended: 2 coats, recoat after 2 hours. Apply by roller or brush; dilute with water 5–10%.','Рекомендуется 2 слоя, повторное нанесение через 2 часа. Наносить валиком или кистью; разбавлять водой на 5–10%.','Ұсынылады: 2 қабат, келесі қабат 2 сағаттан кейін. Білікпен немесе қылқаламмен жағылады; сумен 5–10% сұйылтылады.'],
      ['Application temperature: +10 °C to +30 °C. Wet-scrub class 2 (EN 13300).','Температура нанесения: от +10 °C до +30 °C. Класс влажного истирания 2 (EN 13300).','Жағу температурасы: +10 °C-тан +30 °C-қа дейін. Ылғалды ысқылау сыныбы 2 (EN 13300).'] ] },
    { id: 'spec3', doc: 'spec', loc: { page: 4 }, topic: 'specs', lines: [
      ['MetalGuard 3-in-1 coverage: 8–10 m² per litre per coat; one 2.5 L pack covers about 20–25 m².','Расход MetalGuard 3-in-1: 8–10 м² на литр на слой; упаковка 2,5 л покрывает около 20–25 м².','MetalGuard 3-in-1 жабу ауданы: бір қабатта литріне 8–10 м²; 2,5 л қаптама шамамен 20–25 м² жабады.'],
      ['Dry to touch: 1 hour. Recoat after 6 hours. Apply by brush or roller.','Высыхание на отлип: 1 час. Повторное нанесение через 6 часов. Наносить кистью или валиком.','Қолға жабыспауы: 1 сағат. Келесі қабат 6 сағаттан кейін. Қылқаламмен немесе білікпен жағылады.'],
      ['Application temperature: −10 °C to +35 °C. Maximum rust layer thickness: 100 µm; loose rust must be removed first.','Температура нанесения: от −10 °C до +35 °C. Максимальная толщина слоя ржавчины: 100 мкм; рыхлую ржавчину необходимо предварительно удалить.','Жағу температурасы: −10 °C-тан +35 °C-қа дейін. Тот қабатының ең үлкен қалыңдығы: 100 мкм; борпылдақ тотты алдын ала алып тастау керек.'] ] },
    { id: 'spec4', doc: 'spec', loc: { page: 5 }, topic: 'specs', lines: [
      ['WoodCare Lasur coverage: 10–12 m² per litre per coat; one 2.5 L pack covers about 25–30 m².','Расход WoodCare Lasur: 10–12 м² на литр на слой; упаковка 2,5 л покрывает около 25–30 м².','WoodCare Lasur жабу ауданы: бір қабатта литріне 10–12 м²; 2,5 л қаптама шамамен 25–30 м² жабады.'],
      ['Apply 2 coats by brush; recoat after 8 hours. Wood moisture must not exceed 18%.','Наносить 2 слоя кистью; повторное нанесение через 8 часов. Влажность древесины не должна превышать 18%.','Қылқаламмен 2 қабат жағылады; келесі қабат 8 сағаттан кейін. Ағаш ылғалдылығы 18%-дан аспауы керек.'] ] },
    { id: 'spec5', doc: 'spec', loc: { page: 6 }, topic: 'specs', lines: [
      ['AquaPrime 100 coverage: 10–12 m² per litre; dries in 2 hours before topcoat.','Расход AquaPrime 100: 10–12 м² на литр; сохнет 2 часа до нанесения финишного слоя.','AquaPrime 100 жабу ауданы: литріне 10–12 м²; соңғы қабатқа дейін 2 сағатта кебеді.'],
      ['FlexSeal consumption: 1.2 kg per m² for two layers. Tile adhesive can be applied 24 hours after the last layer.','Расход FlexSeal: 1,2 кг на м² на два слоя. Плиточный клей можно наносить через 24 часа после последнего слоя.','FlexSeal шығыны: екі қабатқа 1 м²-ге 1,2 кг. Плитка желімін соңғы қабаттан 24 сағат өткен соң жағуға болады.'] ] },

    { id: 'comp1', doc: 'comp', loc: { rows: '2–4' }, topic: 'compat', lines: [
      ['TerraShield X5 on concrete, plaster, brick: compatible — prime with AquaPrime 100 first.','TerraShield X5 по бетону, штукатурке, кирпичу: совместимо — предварительно загрунтовать AquaPrime 100.','TerraShield X5 бетонға, сылаққа, кірпішке: үйлесімді — алдымен AquaPrime 100 грунтымен грунттау керек.'],
      ['TerraShield X5 over old oil-based or alkyd paint: not compatible — remove the old coating first.','TerraShield X5 по старой масляной или алкидной краске: несовместимо — сначала удалить старое покрытие.','TerraShield X5 ескі майлы немесе алкидті бояудың үстіне: үйлесімсіз — алдымен ескі жабынды алып тастау керек.'],
      ['TerraShield X5 on bare metal: not recommended — use MetalGuard 3-in-1.','TerraShield X5 по голому металлу: не рекомендуется — используйте MetalGuard 3-in-1.','TerraShield X5 жалаңаш металға: ұсынылмайды — MetalGuard 3-in-1 қолданыңыз.'] ] },
    { id: 'comp2', doc: 'comp', loc: { rows: '5–7' }, topic: 'compat', lines: [
      ['SilkWall Interior Matt on plaster, drywall, concrete: compatible — prime with AquaPrime 100 first.','SilkWall Interior Matt по штукатурке, гипсокартону, бетону: совместимо — предварительно загрунтовать AquaPrime 100.','SilkWall Interior Matt сылаққа, гипсокартонға, бетонға: үйлесімді — алдымен AquaPrime 100 грунтымен грунттау керек.'],
      ['SilkWall Interior Matt in bathrooms and other wet areas: not recommended — protect wet zones with FlexSeal.','SilkWall Interior Matt в ванных и других влажных зонах: не рекомендуется — влажные зоны защитить FlexSeal.','SilkWall Interior Matt жуынатын бөлмелерде және басқа ылғалды аймақтарда: ұсынылмайды — ылғалды аймақтарды FlexSeal-мен қорғаңыз.'],
      ['SilkWall Interior Matt on wood or metal: not compatible.','SilkWall Interior Matt по дереву или металлу: несовместимо.','SilkWall Interior Matt ағашқа немесе металға: үйлесімсіз.'] ] },
    { id: 'comp3', doc: 'comp', loc: { rows: '8–11' }, topic: 'compat', lines: [
      ['MetalGuard 3-in-1 on steel and iron: compatible — apply directly, no primer needed.','MetalGuard 3-in-1 по стали и железу: совместимо — наносить напрямую, грунт не требуется.','MetalGuard 3-in-1 болатқа және темірге: үйлесімді — тікелей жағылады, грунт қажет емес.'],
      ['MetalGuard 3-in-1 on galvanized steel: compatible after degreasing.','MetalGuard 3-in-1 по оцинкованной стали: совместимо после обезжиривания.','MetalGuard 3-in-1 мырышталған болатқа: майсыздандырудан кейін үйлесімді.'],
      ['AquaPrime 100 on metal: not compatible — water-based primer is not suitable for metal.','AquaPrime 100 по металлу: несовместимо — грунт на водной основе не подходит для металла.','AquaPrime 100 металға: үйлесімсіз — су негізіндегі грунт металға жарамайды.'] ] },
    { id: 'comp4', doc: 'comp', loc: { rows: '12–15' }, topic: 'compat', lines: [
      ['WoodCare Lasur on bare wood: compatible. Over wax or oil-based coatings: not compatible.','WoodCare Lasur по голой древесине: совместимо. Поверх воска или масляных покрытий: несовместимо.','WoodCare Lasur жалаңаш ағашқа: үйлесімді. Балауыздың немесе майлы жабындардың үстіне: үйлесімсіз.'],
      ['FlexSeal under tile adhesive: compatible. FlexSeal on concrete and plaster: compatible after AquaPrime 100.','FlexSeal под плиточный клей: совместимо. FlexSeal по бетону и штукатурке: совместимо после AquaPrime 100.','FlexSeal плитка желімінің астына: үйлесімді. FlexSeal бетонға және сылаққа: AquaPrime 100-ден кейін үйлесімді.'] ] },

    { id: 'deliv1', doc: 'deliv', loc: { section: '§1' }, topic: 'delivery', lines: [
      ['Delivery within Almaty is free for orders of 150,000 ₸ or more; for smaller orders the delivery fee is 3,500 ₸.','Доставка по Алматы бесплатна для заказов от 150 000 ₸; для заказов меньшей суммы стоимость доставки — 3 500 ₸.','Алматы бойынша жеткізу 150 000 ₸ және одан жоғары тапсырыстарға тегін; шағын тапсырыстар үшін жеткізу құны — 3 500 ₸.'],
      ['Orders confirmed before 14:00 on a business day are shipped the same day.','Заказы, подтверждённые до 14:00 в рабочий день, отправляются в тот же день.','Жұмыс күні 14:00-ге дейін расталған тапсырыстар сол күні жөнелтіледі.'] ] },
    { id: 'deliv2', doc: 'deliv', loc: { section: '§2' }, topic: 'delivery', lines: [
      ['Delivery to Astana takes 2–3 business days; to other regions of Kazakhstan 3–7 business days, via partner carriers.','Доставка в Астану занимает 2–3 рабочих дня; в другие регионы Казахстана — 3–7 рабочих дней, силами партнёрских перевозчиков.','Астанаға жеткізу 2–3 жұмыс күнін алады; Қазақстанның басқа өңірлеріне — серіктес тасымалдаушылар арқылы 3–7 жұмыс күні.'],
      ['The carrier\'s tariff applies and is paid by the customer on receipt.','Применяется тариф перевозчика; оплачивается клиентом при получении.','Тасымалдаушы тарифі қолданылады және тапсырыс берушімен алу кезінде төленеді.'] ] },
    { id: 'deliv3', doc: 'deliv', loc: { section: '§3' }, topic: 'delivery', lines: [
      ['Pickup from the Almaty warehouse is free: Mon–Fri 09:00–18:00, Sat 10:00–15:00.','Самовывоз со склада в Алматы бесплатный: пн–пт 09:00–18:00, сб 10:00–15:00.','Алматы қоймасынан өзі алып кету тегін: дс–жм 09:00–18:00, сб 10:00–15:00.'],
      ['Inspect goods on receipt. Report damaged or missing items within 24 hours of receipt.','Проверяйте товар при получении. О повреждённых или недостающих позициях сообщайте в течение 24 часов после получения.','Тауарды алу кезінде тексеріңіз. Зақымдалған немесе жетіспейтін позициялар туралы алғаннан кейін 24 сағат ішінде хабарлаңыз.'] ] },

    { id: 'warr1', doc: 'warr', loc: { section: '§1' }, topic: 'warranty', lines: [
      ['Warranty periods: TerraShield X5 — 10 years; MetalGuard 3-in-1 — 7 years; SilkWall Interior Matt — 5 years; FlexSeal — 5 years; WoodCare Lasur — 3 years; AquaPrime 100 — 2 years.','Гарантийные сроки: TerraShield X5 — 10 лет; MetalGuard 3-in-1 — 7 лет; SilkWall Interior Matt — 5 лет; FlexSeal — 5 лет; WoodCare Lasur — 3 года; AquaPrime 100 — 2 года.','Кепілдік мерзімдері: TerraShield X5 — 10 жыл; MetalGuard 3-in-1 — 7 жыл; SilkWall Interior Matt — 5 жыл; FlexSeal — 5 жыл; WoodCare Lasur — 3 жыл; AquaPrime 100 — 2 жыл.'],
      ['Warranty covers loss of protective or decorative properties of the film when the product is used as specified.','Гарантия распространяется на потерю защитных или декоративных свойств плёнки при использовании продукта согласно инструкции.','Кепілдік өнім нұсқаулыққа сай қолданылғанда жабынның қорғаныш не сәндік қасиеттерінің жоғалуына таралады.'] ] },
    { id: 'warr2', doc: 'warr', loc: { section: '§2' }, topic: 'warranty', lines: [
      ['The warranty applies only if the surface was prepared and the recommended primer was used according to the Technical Specifications.','Гарантия действует только если поверхность подготовлена и использован рекомендованный грунт согласно Техническим характеристикам.','Кепілдік бет дайындалған және Техникалық сипаттамаларға сай ұсынылған грунт қолданылған жағдайда ғана күшінде.'],
      ['A claim requires the receipt, a photo of the batch number on the can and photos of the affected surface.','Для рекламации нужны чек, фото номера партии на банке и фото повреждённой поверхности.','Шағым үшін чек, банкадағы партия нөмірінің фотосы және зақымдалған беттің фотолары қажет.'],
      ['Mechanical damage and damage from improper storage are not covered. Claims are reviewed within 10 business days.','Механические повреждения и повреждения из-за неправильного хранения не покрываются. Рекламации рассматриваются в течение 10 рабочих дней.','Механикалық зақымдар мен дұрыс сақталмаудан болған зақымдар қамтылмайды. Шағымдар 10 жұмыс күні ішінде қаралады.'] ] },
    { id: 'warr3', doc: 'warr', loc: { section: '§3' }, topic: 'returns', lines: [
      ['Unopened products in original packaging can be returned within 14 days of purchase with the receipt.','Нераспечатанный товар в оригинальной упаковке можно вернуть в течение 14 дней с момента покупки при наличии чека.','Ашылмаған, түпнұсқа қаптамадағы тауарды сатып алған күннен бастап 14 күн ішінде чекпен қайтаруға болады.'],
      ['Tinted products cannot be returned.','Колерованный товар возврату не подлежит.','Түстелген тауарды қайтаруға болмайды.'],
      ['Refunds are paid within 7 business days after the returned goods are accepted.','Возврат денег производится в течение 7 рабочих дней после приёмки возвращённого товара.','Қайтарылған тауар қабылданғаннан кейін ақша 7 жұмыс күні ішінде қайтарылады.'] ] },

    { id: 'faq1', doc: 'faq', loc: { lines: '1–6' }, topic: 'general', lines: [
      ['Customer service hours: Monday–Friday 09:00–18:00, Saturday 10:00–15:00; Sunday closed.','Часы работы клиентской службы: понедельник–пятница 09:00–18:00, суббота 10:00–15:00; воскресенье — выходной.','Тапсырыс берушілерге қызмет көрсету уақыты: дүйсенбі–жұма 09:00–18:00, сенбі 10:00–15:00; жексенбі — демалыс.'],
      ['Support e-mail: support@zhaiyk-coatings.example.','E-mail поддержки: support@zhaiyk-coatings.example.','Қолдау қызметінің e-mail: support@zhaiyk-coatings.example.'] ] },
    { id: 'faq2', doc: 'faq', loc: { lines: '7–12' }, topic: 'pricing', lines: [
      ['Tinting is available for TerraShield X5 and SilkWall Interior Matt: 1,200 colours, about 15 minutes per can.','Колеровка доступна для TerraShield X5 и SilkWall Interior Matt: 1 200 цветов, около 15 минут на банку.','Түстеу TerraShield X5 және SilkWall Interior Matt үшін қолжетімді: 1 200 түс, бір банкаға шамамен 15 минут.'],
      ['Tinting costs 1,500 ₸ per can. Tinted cans cannot be returned.','Колеровка стоит 1 500 ₸ за банку. Колерованные банки возврату не подлежат.','Түстеу бір банкаға 1 500 ₸ тұрады. Түстелген банкаларды қайтаруға болмайды.'] ] },
    { id: 'faq3', doc: 'faq', loc: { lines: '13–18' }, topic: 'discounts', lines: [
      ['Sales managers may approve a discount of up to 10%. Anything higher requires approval from the Head of Sales.','Менеджеры по продажам могут согласовать скидку до 10%. Более высокая скидка требует одобрения руководителя отдела продаж.','Сату менеджерлері 10%-ға дейін жеңілдікті келісе алады. Одан жоғары жеңілдікке сату бөлімінің басшысы рұқсат етуі керек.'],
      ['Contractor partner cards are issued after registration and are valid for 12 months.','Партнёрские карты подрядчиков выдаются после регистрации и действуют 12 месяцев.','Мердігерлердің серіктес карталары тіркелгеннен кейін беріледі және 12 ай жарамды.'] ] },
    { id: 'faq4', doc: 'faq', loc: { lines: '19–24' }, topic: 'pricing', lines: [
      ['The price list is updated yearly. If the catalog and the price list differ, the price list is authoritative.','Прайс-лист обновляется ежегодно. Если каталог и прайс-лист расходятся, приоритет имеет прайс-лист.','Баға тізімі жыл сайын жаңартылады. Каталог пен баға тізімі сәйкес келмесе, баға тізімі басымдыққа ие.'] ] },
  ];

  // Curated, pre-verified demo questions. ev: [chunkId, [lineIdx...]]
  const QA = [
    { id: 'q-price-x5', topic: 'pricing', q: ['How much does TerraShield X5 cost?','Сколько стоит TerraShield X5?','TerraShield X5 қанша тұрады?'],
      direct: ['A 10 L pack of TerraShield X5 costs 42,800 ₸ (price list 2026, VAT included).','Упаковка TerraShield X5 10 л стоит 42 800 ₸ (прайс-лист 2026, с НДС).','TerraShield X5 10 л қаптамасы 42 800 ₸ тұрады (2026 баға тізімі, ҚҚС қоса).'],
      details: [['The 2025 catalog shows an older price (40,900 ₸); the Internal FAQ says the price list is authoritative.','В каталоге 2025 г. указана более старая цена (40 900 ₸); по внутреннему FAQ приоритет у прайс-листа.','2025 жылғы каталогта ескі баға (40 900 ₸) көрсетілген; ішкі FAQ бойынша баға тізімі басым.'],['Price list is valid until 31 December 2026.','Прайс-лист действует до 31 декабря 2026 г.','Баға тізімі 2026 жылғы 31 желтоқсанға дейін жарамды.']],
      ev: [['price1',[0]],['cat1',[1]],['faq4',[0]],['price2',[3]]], strength: 'strong',
      conflict: { a: ['price1',0], b: ['cat1',1], rule: ['faq4',0], note: ['Sources disagree on price','Источники расходятся по цене','Дереккөздер баға бойынша сәйкес емес'] },
      follow: ['q-disc','q-cov-x5','q-warr-x5'] },
    { id: 'q-price-silk', topic: 'pricing', q: ['What is the price of SilkWall Interior Matt?','Какая цена у SilkWall Interior Matt?','SilkWall Interior Matt бағасы қандай?'],
      direct: ['SilkWall Interior Matt, 9 L, costs 27,900 ₸.','SilkWall Interior Matt, 9 л, стоит 27 900 ₸.','SilkWall Interior Matt, 9 л, 27 900 ₸ тұрады.'],
      details: [['Prices include VAT 12% and are valid until 31 December 2026.','Цены включают НДС 12% и действуют до 31 декабря 2026 г.','Бағаларға ҚҚС 12% кіреді, 2026 жылғы 31 желтоқсанға дейін жарамды.']],
      ev: [['price1',[1]],['price2',[3]]], strength: 'strong', follow: ['q-cov-silk','q-tint'] },
    { id: 'q-price-mg', topic: 'pricing', q: ['How much is MetalGuard 3-in-1?','Сколько стоит MetalGuard 3-in-1?','MetalGuard 3-in-1 қанша тұрады?'],
      direct: ['MetalGuard 3-in-1, 2.5 L, costs 19,600 ₸.','MetalGuard 3-in-1, 2,5 л, стоит 19 600 ₸.','MetalGuard 3-in-1, 2,5 л, 19 600 ₸ тұрады.'],
      details: [['Price includes VAT 12%.','Цена включает НДС 12%.','Бағаға ҚҚС 12% кіреді.']],
      ev: [['price2',[0,3]]], strength: 'strong', follow: ['q-rust','q-compat-mg-aqua'] },
    { id: 'q-warr-x5', topic: 'warranty', q: ['What is the warranty period for TerraShield X5?','Какой гарантийный срок на TerraShield X5?','TerraShield X5 кепілдік мерзімі қандай?'],
      direct: ['TerraShield X5 has a 10-year warranty.','На TerraShield X5 действует гарантия 10 лет.','TerraShield X5 үшін кепілдік мерзімі — 10 жыл.'],
      details: [['The warranty applies only if the surface was prepared and the recommended primer (AquaPrime 100) was used.','Гарантия действует, только если поверхность подготовлена и использован рекомендованный грунт.','Кепілдік бет дайындалып, ұсынылған грунт қолданылғанда ғана күшінде.']],
      ev: [['warr1',[0]],['warr2',[0]]], strength: 'strong', follow: ['q-claim','q-warr-all'] },
    { id: 'q-warr-all', topic: 'warranty', q: ['What is the warranty period?','Какой гарантийный срок?','Кепілдік мерзімі қандай?'],
      direct: ['It depends on the product: from 2 years (AquaPrime 100) up to 10 years (TerraShield X5).','Зависит от продукта: от 2 лет (AquaPrime 100) до 10 лет (TerraShield X5).','Өнімге байланысты: 2 жылдан (AquaPrime 100) 10 жылға (TerraShield X5) дейін.'],
      details: [['MetalGuard 7 years; SilkWall and FlexSeal 5 years; WoodCare Lasur 3 years.','MetalGuard — 7 лет; SilkWall и FlexSeal — 5 лет; WoodCare Lasur — 3 года.','MetalGuard — 7 жыл; SilkWall және FlexSeal — 5 жыл; WoodCare Lasur — 3 жыл.']],
      ev: [['warr1',[0,1]]], strength: 'strong', follow: ['q-claim','q-return'] },
    { id: 'q-claim', topic: 'warranty', q: ['What do I need to file a warranty claim?','Что нужно для подачи гарантийной рекламации?','Кепілдік шағымын беру үшін не қажет?'],
      direct: ['You need the receipt, a photo of the batch number on the can and photos of the affected surface.','Нужны чек, фото номера партии на банке и фото повреждённой поверхности.','Чек, банкадағы партия нөмірінің фотосы және зақымдалған беттің фотолары қажет.'],
      details: [['Claims are reviewed within 10 business days.','Рекламации рассматриваются в течение 10 рабочих дней.','Шағымдар 10 жұмыс күні ішінде қаралады.'],['Mechanical damage and improper storage are not covered.','Механические повреждения и неправильное хранение не покрываются.','Механикалық зақымдар мен дұрыс сақталмау қамтылмайды.']],
      ev: [['warr2',[1,2]]], strength: 'strong', follow: ['q-warr-all'] },
    { id: 'q-facade', topic: 'compat', q: ['Which paint is suitable for a concrete facade?','Какая краска подходит для бетонного фасада?','Бетон қасбетке қандай бояу жарамды?'],
      direct: ['TerraShield X5, primed first with AquaPrime 100.','TerraShield X5, предварительно загрунтованный AquaPrime 100.','TerraShield X5, алдын ала AquaPrime 100 грунтымен грунттау керек.'],
      details: [['TerraShield X5 is an exterior acrylic facade paint for concrete, plaster and brick.','TerraShield X5 — акриловая фасадная краска для бетона, штукатурки и кирпича.','TerraShield X5 — бетонға, сылаққа және кірпішке арналған акрилді қасбет бояуы.'],['Not compatible over old oil-based or alkyd paint — remove it first.','Несовместима со старой масляной или алкидной краской — сначала удалите её.','Ескі майлы немесе алкидті бояудың үстіне үйлесімсіз — алдымен алып тастаңыз.']],
      ev: [['cat1',[0]],['comp1',[0,1]],['cat5',[0]]], strength: 'strong', follow: ['q-compat-x5-aqua','q-cov-x5','q-apply-x5'] },
    { id: 'q-rust', topic: 'compat', q: ['Which product should I use on rusty metal?','Что использовать для ржавого металла?','Тот басқан металға қандай өнім қолдану керек?'],
      direct: ['MetalGuard 3-in-1 — it can be applied directly onto firmly bonded rust.','MetalGuard 3-in-1 — его можно наносить прямо на плотно сцепленную ржавчину.','MetalGuard 3-in-1 — оны мықтап жабысқан тоттың үстіне тікелей жағуға болады.'],
      details: [['Remove loose rust first; maximum rust layer is 100 µm.','Рыхлую ржавчину сначала удалить; максимальная толщина слоя ржавчины — 100 мкм.','Алдымен борпылдақ тотты алыңыз; тот қабатының ең үлкен қалыңдығы — 100 мкм.']],
      ev: [['cat3',[0,1]],['spec3',[2]],['comp3',[0]]], strength: 'strong', follow: ['q-compat-mg-aqua','q-price-mg'] },
    { id: 'q-compat-x5-aqua', topic: 'compat', q: ['Is TerraShield X5 compatible with AquaPrime 100?','TerraShield X5 совместим с AquaPrime 100?','TerraShield X5 AquaPrime 100-мен үйлесімді ме?'],
      direct: ['Yes. AquaPrime 100 is the recommended primer under TerraShield X5 on concrete, plaster and brick.','Да. AquaPrime 100 — рекомендованный грунт под TerraShield X5 по бетону, штукатурке и кирпичу.','Иә. AquaPrime 100 — бетон, сылақ және кірпіш үстіндегі TerraShield X5 астына ұсынылатын грунт.'],
      details: [['Two documents agree: the compatibility table and the product catalog.','Два документа согласуются: таблица совместимости и каталог.','Екі құжат сәйкес: үйлесімділік кестесі мен каталог.']],
      ev: [['comp1',[0]],['cat5',[0]],['warr2',[0]]], strength: 'strong', follow: ['q-compat-mg-aqua','q-facade'] },
    { id: 'q-compat-mg-aqua', topic: 'compat', q: ['Is MetalGuard 3-in-1 compatible with AquaPrime 100?','MetalGuard 3-in-1 совместим с AquaPrime 100?','MetalGuard 3-in-1 AquaPrime 100-мен үйлесімді ме?'],
      direct: ['No. AquaPrime 100 is not compatible with metal.','Нет. AquaPrime 100 несовместим с металлом.','Жоқ. AquaPrime 100 металға үйлесімсіз.'],
      details: [['MetalGuard 3-in-1 contains its own primer and is applied directly to steel and iron.','MetalGuard 3-in-1 уже содержит грунт и наносится напрямую на сталь и железо.','MetalGuard 3-in-1 құрамында грунт бар және болат пен темірге тікелей жағылады.']],
      ev: [['comp3',[2,0]],['cat3',[0]]], strength: 'strong', follow: ['q-rust'] },
    { id: 'q-bath', topic: 'compat', q: ['Can SilkWall be used in a bathroom?','Можно ли использовать SilkWall в ванной?','SilkWall-ды жуынатын бөлмеде қолдануға бола ма?'],
      direct: ['Not recommended. SilkWall is not intended for permanently wet areas.','Не рекомендуется. SilkWall не предназначена для постоянно влажных зон.','Ұсынылмайды. SilkWall тұрақты ылғалды аймақтарға арналмаған.'],
      details: [['The compatibility table suggests protecting wet zones with FlexSeal.','Таблица совместимости рекомендует защищать влажные зоны FlexSeal.','Үйлесімділік кестесі ылғалды аймақтарды FlexSeal-мен қорғауды ұсынады.']],
      ev: [['comp2',[1]],['cat2',[2]],['cat5',[1]]], strength: 'strong', follow: ['q-price-silk'] },
    { id: 'q-deliv-alm', topic: 'delivery', q: ['What are the delivery conditions in Almaty?','Каковы условия доставки по Алматы?','Алматы бойынша жеткізу шарттары қандай?'],
      direct: ['Free for orders of 150,000 ₸ or more; otherwise 3,500 ₸.','Бесплатно для заказов от 150 000 ₸; иначе — 3 500 ₸.','150 000 ₸ және одан жоғары тапсырысқа тегін; әйтпесе — 3 500 ₸.'],
      details: [['Orders confirmed before 14:00 on a business day ship the same day.','Заказы, подтверждённые до 14:00 в рабочий день, отправляются в тот же день.','Жұмыс күні 14:00-ге дейін расталған тапсырыстар сол күні жөнелтіледі.'],['Free pickup from the Almaty warehouse is also available.','Также доступен бесплатный самовывоз со склада в Алматы.','Алматы қоймасынан тегін өзі алып кету де бар.']],
      ev: [['deliv1',[0,1]],['deliv3',[0]]], strength: 'strong', follow: ['q-deliv-astana','q-return'] },
    { id: 'q-deliv-astana', topic: 'delivery', q: ['How long does delivery to Astana take?','Сколько занимает доставка в Астану?','Астанаға жеткізу қанша уақыт алады?'],
      direct: ['2–3 business days.','2–3 рабочих дня.','2–3 жұмыс күні.'],
      details: [['Other regions of Kazakhstan: 3–7 business days via partner carriers; the carrier\'s tariff is paid on receipt.','Другие регионы Казахстана: 3–7 рабочих дней силами партнёрских перевозчиков; тариф оплачивается при получении.','Қазақстанның басқа өңірлері: серіктес тасымалдаушылармен 3–7 жұмыс күні; тариф алу кезінде төленеді.']],
      ev: [['deliv2',[0,1]]], strength: 'strong', follow: ['q-deliv-alm'] },
    { id: 'q-sameday', topic: 'delivery', q: ['Do you ship orders the same day?','Отправляете ли вы заказы в день обращения?','Тапсырыстарды сол күні жібересіздер ме?'],
      direct: ['Yes, if the order is confirmed before 14:00 on a business day.','Да, если заказ подтверждён до 14:00 в рабочий день.','Иә, егер тапсырыс жұмыс күні 14:00-ге дейін расталса.'],
      details: [], ev: [['deliv1',[1]]], strength: 'strong', follow: ['q-deliv-alm'] },
    { id: 'q-cov-x5', topic: 'specs', q: ['What is the coverage of TerraShield X5?','Каков расход TerraShield X5?','TerraShield X5 жабу ауданы қандай?'],
      direct: ['7–9 m² per litre per coat — a 10 L pack covers about 70–90 m² per coat.','7–9 м² на литр на слой — упаковка 10 л покрывает около 70–90 м² на слой.','Бір қабатта литріне 7–9 м² — 10 л қаптама бір қабатта шамамен 70–90 м² жабады.'],
      details: [['Two coats are recommended.','Рекомендуется два слоя.','Екі қабат ұсынылады.']],
      ev: [['spec1',[0,1]]], strength: 'strong', follow: ['q-apply-x5','q-price-x5'] },
    { id: 'q-cov-silk', topic: 'specs', q: ['What is the coverage of SilkWall Interior Matt?','Каков расход SilkWall Interior Matt?','SilkWall Interior Matt жабу ауданы қандай?'],
      direct: ['9–11 m² per litre per coat — a 9 L pack covers about 81–99 m².','9–11 м² на литр на слой — упаковка 9 л покрывает около 81–99 м².','Бір қабатта литріне 9–11 м² — 9 л қаптама шамамен 81–99 м² жабады.'],
      details: [], ev: [['spec2',[0,1]]], strength: 'strong', follow: ['q-price-silk'] },
    { id: 'q-apply-x5', topic: 'specs', q: ['What is the recommended application method for TerraShield X5?','Каков рекомендуемый способ нанесения TerraShield X5?','TerraShield X5 жағудың ұсынылатын тәсілі қандай?'],
      direct: ['Apply with a roller, brush or airless sprayer, in 2 coats.','Наносить валиком, кистью или безвоздушным распылителем в 2 слоя.','Білікпен, қылқаламмен немесе ауасыз бүріккішпен 2 қабат жағылады.'],
      details: [['Temperature +5 °C to +35 °C; dilute with water up to 5%.','Температура от +5 °C до +35 °C; разбавлять водой до 5%.','Температура +5 °C-тан +35 °C-қа дейін; сумен 5%-ға дейін сұйылтылады.'],['Dry to touch after 2 hours; recoat after 4 hours.','Высыхание на отлип — 2 часа; повторное нанесение — через 4 часа.','Қолға жабыспауы — 2 сағат; келесі қабат — 4 сағаттан кейін.']],
      ev: [['spec1',[1,2]]], strength: 'strong', follow: ['q-cov-x5'] },
    { id: 'q-diff', topic: 'compat', q: ['What is the difference between TerraShield X5 and SilkWall Interior Matt?','В чём разница между TerraShield X5 и SilkWall Interior Matt?','TerraShield X5 мен SilkWall Interior Matt арасындағы айырмашылық қандай?'],
      direct: ['TerraShield X5 is an exterior facade paint; SilkWall Interior Matt is a washable paint for interior walls and ceilings.','TerraShield X5 — фасадная краска для наружных работ; SilkWall Interior Matt — моющаяся краска для стен и потолков внутри помещений.','TerraShield X5 — сыртқы қасбет бояуы; SilkWall Interior Matt — үй ішіндегі қабырғалар мен төбелерге арналған жуылатын бояу.'],
      details: [['Pack: 10 L vs 9 L. Price: 42,800 ₸ vs 27,900 ₸.','Фасовка: 10 л и 9 л. Цена: 42 800 ₸ и 27 900 ₸.','Қаптама: 10 л және 9 л. Баға: 42 800 ₸ және 27 900 ₸.'],['Coverage per litre: 7–9 m² vs 9–11 m². Application temperature: +5…+35 °C vs +10…+30 °C.','Расход на литр: 7–9 м² и 9–11 м². Температура нанесения: +5…+35 °C и +10…+30 °C.','Литріне жабу ауданы: 7–9 м² және 9–11 м². Жағу температурасы: +5…+35 °C және +10…+30 °C.'],['Warranty: 10 years vs 5 years.','Гарантия: 10 лет и 5 лет.','Кепілдік: 10 жыл және 5 жыл.']],
      ev: [['cat1',[0]],['cat2',[0]],['price1',[0,1]],['spec1',[0,2]],['spec2',[0,2]],['warr1',[0]]], strength: 'strong', follow: ['q-price-x5','q-bath'] },
    { id: 'q-disc', topic: 'discounts', q: ['Does the company offer discounts?','Есть ли у компании скидки?','Компанияда жеңілдіктер бар ма?'],
      direct: ['Yes: 5% from 300,000 ₸, 10% from 1,000,000 ₸, and 7% for registered contractors.','Да: 5% от 300 000 ₸, 10% от 1 000 000 ₸ и 7% для зарегистрированных подрядчиков.','Иә: 300 000 ₸-ден 5%, 1 000 000 ₸-ден 10% және тіркелген мердігерлерге 7%.'],
      details: [['Discounts do not stack — only the highest one applies.','Скидки не суммируются — применяется только наибольшая.','Жеңілдіктер қосылмайды — тек ең үлкені қолданылады.'],['Managers can approve up to 10%; more requires the Head of Sales.','Менеджеры могут согласовать до 10%; больше — только с одобрения руководителя отдела продаж.','Менеджерлер 10%-ға дейін келісе алады; одан көбі үшін сату бөлімінің басшысы қажет.']],
      ev: [['price3',[0,1,2,3]],['faq3',[0]]], strength: 'strong', follow: ['q-price-x5'] },
    { id: 'q-return', topic: 'returns', q: ['What is the return policy?','Какова политика возврата?','Қайтару саясаты қандай?'],
      direct: ['Unopened products in original packaging can be returned within 14 days with the receipt.','Нераспечатанный товар в оригинальной упаковке можно вернуть в течение 14 дней при наличии чека.','Ашылмаған, түпнұсқа қаптамадағы тауарды чекпен 14 күн ішінде қайтаруға болады.'],
      details: [['Tinted products cannot be returned.','Колерованный товар возврату не подлежит.','Түстелген тауарды қайтаруға болмайды.'],['Refunds are paid within 7 business days after the goods are accepted.','Деньги возвращаются в течение 7 рабочих дней после приёмки товара.','Ақша тауар қабылданғаннан кейін 7 жұмыс күні ішінде қайтарылады.']],
      ev: [['warr3',[0,1,2]]], strength: 'strong', follow: ['q-tint','q-claim'] },
    { id: 'q-tint', topic: 'pricing', q: ['Can paint be tinted and how much does it cost?','Можно ли колеровать краску и сколько это стоит?','Бояуды түстеуге бола ма және ол қанша тұрады?'],
      direct: ['Yes, for TerraShield X5 and SilkWall Interior Matt: 1,500 ₸ per can, 1,200 colours.','Да, для TerraShield X5 и SilkWall Interior Matt: 1 500 ₸ за банку, 1 200 цветов.','Иә, TerraShield X5 және SilkWall Interior Matt үшін: банкасына 1 500 ₸, 1 200 түс.'],
      details: [['Takes about 15 minutes per can. Tinted cans cannot be returned.','Занимает около 15 минут на банку. Колерованные банки возврату не подлежат.','Бір банкаға шамамен 15 минут кетеді. Түстелген банкаларды қайтаруға болмайды.']],
      ev: [['faq2',[0,1]],['price4',[0]]], strength: 'strong', follow: ['q-return'] },
    { id: 'q-hours', topic: 'general', q: ['What are the customer service hours?','Каков график работы клиентской службы?','Тапсырыс берушілерге қызмет көрсету уақыты қандай?'],
      direct: ['Monday–Friday 09:00–18:00, Saturday 10:00–15:00; closed on Sunday.','Понедельник–пятница 09:00–18:00, суббота 10:00–15:00; воскресенье — выходной.','Дүйсенбі–жұма 09:00–18:00, сенбі 10:00–15:00; жексенбі — демалыс.'],
      details: [], ev: [['faq1',[0]]], strength: 'strong', follow: ['q-deliv-alm'] },

    // ---- Intentionally unanswerable ----
    { id: 'x-intl', abstain: true, topic: 'delivery', q: ['Do you deliver to Russia or other countries?','Доставляете ли вы в Россию или другие страны?','Ресейге немесе басқа елдерге жеткізесіздер ме?'],
      why: ['The Delivery Policy describes Almaty, Astana and other regions of Kazakhstan, but says nothing about international shipping.','Политика доставки описывает Алматы, Астану и другие регионы Казахстана, но ничего не говорит о международной доставке.','Жеткізу саясатында Алматы, Астана және Қазақстанның басқа өңірлері сипатталған, бірақ халықаралық жеткізу туралы ештеңе айтылмаған.'],
      missing: ['No document mentions international shipping, customs or export conditions.','Ни один документ не упоминает международную доставку, таможню или условия экспорта.','Ешбір құжатта халықаралық жеткізу, кеден немесе экспорт шарттары туралы айтылмаған.'], related: ['deliv'], ev: [['deliv2',[0]]] },
    { id: 'x-20l', abstain: true, topic: 'pricing', q: ['How much is a 20 L pack of TerraShield X5?','Сколько стоит упаковка TerraShield X5 20 л?','TerraShield X5 20 л қаптамасы қанша тұрады?'],
      why: ['The documents list TerraShield X5 only in a 10 L pack. A 20 L price is not stated, and I will not extrapolate one.','В документах TerraShield X5 указан только в упаковке 10 л. Цена за 20 л не указана, и я не буду её вычислять по аналогии.','Құжаттарда TerraShield X5 тек 10 л қаптамада көрсетілген. 20 л бағасы жоқ, мен оны болжап есептемеймін.'],
      missing: ['No 20 L pack or its price appears in the catalog or the price list.','Упаковка 20 л и её цена не указаны ни в каталоге, ни в прайс-листе.','20 л қаптама және оның бағасы каталогта да, баға тізімінде де жоқ.'], related: ['price','cat'], ev: [['price1',[0]]] },
    { id: 'x-voc', abstain: true, topic: 'safety', q: ['What is the VOC content of SilkWall?','Каково содержание ЛОС в SilkWall?','SilkWall құрамындағы ұшпа органикалық қосылыстар мөлшері қандай?'],
      why: ['The specifications cover coverage, drying time and application temperature, but not VOC content or safety data.','Технические характеристики описывают расход, время высыхания и температуру нанесения, но не содержание ЛОС и данные по безопасности.','Техникалық сипаттамада шығын, кебу уақыты және жағу температурасы бар, бірақ ұшпа органикалық қосылыстар мен қауіпсіздік деректері жоқ.'],
      missing: ['A safety data sheet (SDS) is not in the document library.','Паспорт безопасности (SDS) в библиотеке документов отсутствует.','Қауіпсіздік паспорты (SDS) құжаттар кітапханасында жоқ.'], related: ['spec','cat'], ev: [['spec2',[0]]] },
    { id: 'x-install', abstain: true, topic: 'payment', q: ['Do you offer installment payment?','Есть ли рассрочка?','Бөліп төлеу (рассрочка) бар ма?'],
      why: ['The documents describe prices, discounts and delivery fees, but no payment methods or installment plans.','В документах описаны цены, скидки и стоимость доставки, но нет способов оплаты и рассрочки.','Құжаттарда бағалар, жеңілдіктер және жеткізу құны сипатталған, бірақ төлем тәсілдері мен бөліп төлеу жоқ.'],
      missing: ['No payment terms document is available.','Документ с условиями оплаты отсутствует.','Төлем шарттары туралы құжат жоқ.'], related: ['price','faq'], ev: [['price3',[3]]] },
    { id: 'x-pool', abstain: true, topic: 'specs', q: ['Is TerraShield X5 suitable for swimming pools?','Подходит ли TerraShield X5 для бассейнов?','TerraShield X5 бассейндерге жарай ма?'],
      why: ['TerraShield X5 is documented for concrete, plaster and brick facades. Use in swimming pools or under permanent water contact is not mentioned.','TerraShield X5 описана для фасадов из бетона, штукатурки и кирпича. Применение в бассейнах или при постоянном контакте с водой не упоминается.','TerraShield X5 бетон, сылақ және кірпіш қасбеттері үшін сипатталған. Бассейнде немесе судың тұрақты әсерінде қолдану туралы айтылмаған.'],
      missing: ['No document confirms or excludes immersion or pool use.','Ни один документ не подтверждает и не исключает применение в бассейнах.','Бассейнде қолдануды растайтын не жоққа шығаратын құжат жоқ.'], related: ['spec','comp'], ev: [['cat1',[0]],['comp1',[0]]] },
  ];

  // Topics for coverage view. Expected topics with no chunks are coverage gaps.
  const TOPICS = [
    { id: 'pricing',   n: ['Pricing','Цены','Бағалар'] },
    { id: 'specs',     n: ['Technical specifications','Технические характеристики','Техникалық сипаттамалар'] },
    { id: 'compat',    n: ['Compatibility','Совместимость','Үйлесімділік'] },
    { id: 'delivery',  n: ['Delivery','Доставка','Жеткізу'] },
    { id: 'warranty',  n: ['Warranty','Гарантия','Кепілдік'] },
    { id: 'returns',   n: ['Returns','Возвраты','Қайтару'] },
    { id: 'discounts', n: ['Discounts','Скидки','Жеңілдіктер'] },
    { id: 'general',   n: ['Customer service','Клиентский сервис','Тапсырыс берушілерге қызмет'] },
    { id: 'safety',    n: ['Safety data (SDS)','Безопасность (SDS)','Қауіпсіздік (SDS)'], expected: true },
    { id: 'payment',   n: ['Payment terms','Условия оплаты','Төлем шарттары'], expected: true },
    { id: 'intl',      n: ['International shipping','Международная доставка','Халықаралық жеткізу'], expected: true },
  ];
  return { DOCS, CHUNKS, QA, TOPICS };
})();

export const { DOCS, CHUNKS, QA, TOPICS } = CORPUS;
