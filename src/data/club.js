// كل بيانات النادي في مكان واحد. عدّل هنا وينعكس التغيير على الموقع كله.
// أي شيء عليه تعليق "تجريبي" يحتاج تأكيد من صاحب النادي قبل النشر.

export const club = {
  name: 'ذا دِن',
  nameLatin: 'THE_DEN',
  city: 'الرس، القصيم',
  address: 'طريق الملك سعود بن عبدالعزيز، الرس 58883',
  hours: 'مفتوح 24 ساعة',
  timeZone: 'Asia/Riyadh',
  mapsUrl: 'https://maps.app.goo.gl/Zhfoxcgsby6vGDFh9',
  instagram: { handle: '@theden.gym', url: 'https://www.instagram.com/theden.gym/' },
  storeUrl: 'https://salla.sa/the_den',
  // رقم واتساب النادي بالصيغة الدولية بدون + (مثال: 9665XXXXXXXX).
  // فارغ الآن: زر واتساب يفتح التطبيق ويترك للزائر اختيار جهة الإرسال.
  whatsapp: '',
};

// مأخوذة من متجر النادي على سلة.
export const plans = [
  {
    id: 'one',
    title: 'شهر + شهر هدية',
    paid: 1,
    gift: 1,
    price: 500,
    note: 'مناسب لو تبي تجرب أول',
    url: 'https://salla.sa/the_den/شهر-شهر-هدية/p1706013547',
  },
  {
    id: 'three',
    title: '3 شهور + 3 هدية',
    paid: 3,
    gift: 3,
    price: 1200,
    note: 'الأكثر اشتراكاً',
    featured: true,
    url: 'https://salla.sa/the_den/3-شهور-3شهور-هدية/p1033751554',
  },
  {
    id: 'six',
    title: '6 شهور + 6 هدية',
    paid: 6,
    gift: 6,
    price: 2100,
    note: 'أقل سعر للشهر',
    url: 'https://salla.sa/the_den/6-شهور-6-شهور-هدية/p2032367727',
  },
];

export const features = [
  { title: '24 ساعة', text: 'ما عندنا وقت إقفال. تعال متى ما ناسبك.' },
  { title: 'أحدث الأجهزة', text: 'بيئة رياضية متكاملة بأحدث الأجهزة والتقنيات.' },
  { title: 'تقسيط بدون فوائد', text: 'قسّم اشتراكك على 4 دفعات عبر تابي.' },
  { title: 'متجر داخل النادي', text: 'أطقم بتصميم العرين ومكملات رياضية.' },
];

// تجريبي: أسماء البرامج ووصفها تحتاج تأكيد من النادي.
export const programs = [
  {
    id: 'strength',
    title: 'القوة وكمال الأجسام',
    image: 'media/strength.jpg',
    focus: '50% 74%',
    text: 'صالة أوزان حرة وأجهزة مقاومة تغطي كل عضلة، لمن يبني حجم أو يرفع أرقامه.',
    points: ['أوزان حرة وبارات', 'أجهزة مقاومة', 'منطقة سكوات وديدلفت'],
  },
  {
    id: 'cardio',
    title: 'اللياقة والكارديو',
    image: 'media/cardio.jpg',
    text: 'أجهزة كارديو متنوعة لحرق الدهون ورفع التحمل، قبل التمرين أو بعده.',
    points: ['سير ودراجات', 'أجهزة تجديف', 'تمارين عالية الشدة'],
  },
  {
    id: 'coach',
    title: 'التدريب الشخصي',
    image: 'media/coach.jpg',
    text: 'مدرب يبني لك خطة على هدفك ويتابع تقدمك تمرين بتمرين.',
    points: ['خطة حسب هدفك', 'تصحيح الأداء', 'متابعة أسبوعية'],
  },
];

// تجريبي: صور من Pexels (ترخيص مجاني) إلى أن تتوفر صور النادي الحقيقية.
export const gallery = [
  { src: 'media/g-floor.jpg', alt: 'صالة النادي' },
  { src: 'media/g-plates.jpg', alt: 'أقراص الأوزان' },
  { src: 'media/g-dumbbell.jpg', alt: 'دمبل' },
  { src: 'media/g-barbell.jpg', alt: 'بار على الأرضية' },
  { src: 'media/g-free.jpg', alt: 'منطقة الأوزان الحرة' },
  { src: 'media/g-bike.jpg', alt: 'دراجة هوائية' },
];

// تجريبي: المنتجات وأسعارها ورسوم التوصيل أمثلة إلى أن يعتمدها النادي.
// image اختياري: رابط صورة المنتج. sizes للملابس فقط.
export const products = [
  { id: 'hoodie', name: 'هودي العرين', category: 'gear', price: 180, sizes: ['S', 'M', 'L', 'XL'], image: 'media/gear.jpg' },
  { id: 'pants', name: 'بنطلون تمرين', category: 'gear', price: 150, sizes: ['S', 'M', 'L', 'XL'] },
  { id: 'cap', name: 'طربوش', category: 'gear', price: 60 },
  { id: 'socks', name: 'شرابات', category: 'gear', price: 35 },
  { id: 'whey', name: 'بروتين واي', category: 'fuel', price: 220, image: 'media/fuel.jpg' },
  { id: 'creatine', name: 'كرياتين', category: 'fuel', price: 110 },
  { id: 'pre', name: 'مشروب قبل التمرين', category: 'fuel', price: 130 },
];

export const shop = {
  deliveryFee: 25,
  deliveryNote: 'التوصيل داخل الرس.',
  pickupNote: 'استلم طلبك من استقبال النادي، أي ساعة.',
  gear: {
    title: 'أطقم العرين',
    text: 'لبس بتصميمنا وباسم النادي، تلبسه في التمرين وبرّا النادي.',
    items: ['هوديات', 'بناطيل', 'طرابيش', 'شرابات'],
    image: 'media/gear.jpg',
  },
  fuel: {
    title: 'المكملات الرياضية',
    text: 'خلّص تمرينك وخذ مكملك وأنت طالع. اسأل الاستقبال عن المتوفر.',
    image: 'media/fuel.jpg',
  },
};

// نظام "جيب صاحبك": الخصم للطرفين، صاحب الكود واللي جابه.
export const referral = {
  prefix: 'DEN',
  // قيمة الخصم كما تظهر للزوار (مثال: 10%). فارغة إلى أن يحددها النادي.
  discount: '',
  steps: [
    'اكتب رقم جوالك وخذ كودك.',
    'صاحبك يعطي الكود للاستقبال وقت اشتراكه وياخذ خصمه.',
    'وأنت ينزل لك خصم على تجديدك الجاي.',
  ],
};

export const hero = {
  lineOne: 'قوّتك',
  lineTwo: 'لها عرين.',
  lede: 'نادي ذا دِن الرياضي في الرس. أحدث الأجهزة، وباب ما يقفل، ومكان يشبه طموحك.',
};

// اللون المميز للأزرار والشارات.
export const theme = { accent: '#9a6a3c' };

// لا نختلق تقييمات. تُضاف آراء حقيقية هنا بعد موافقة أصحابها:
// { name: 'الاسم', text: 'نص الرأي' }
export const reviews = [];

export const nav = [
  { href: '#about', label: 'النادي' },
  { href: '#programs', label: 'البرامج' },
  { href: '#gallery', label: 'المرافق' },
  { href: '#plans', label: 'الاشتراكات' },
  { href: '#shop', label: 'المتجر' },
  { href: '#contact', label: 'تواصل' },
];
