export type Lang = "en" | "hi" | "ta" | "pa";

type Dict = Record<string, string>;

const en: Dict = {
  app_name: "Classless",
  navbar_dashboard: "Dashboard",
  navbar_ask: "Ask Question",
  navbar_quiz: "Quiz",
  navbar_career: "Career Guidance",
  hero_title1: "Inclusive AI Tutor",
  hero_title2: "for All Students",
  hero_desc:
    "Breaking barriers to education with multilingual AI tutoring accessible via web, SMS, voice calls, and community stations.",
  start_learning_now: "Start Learning Now",
  find_learning_station: "Find Learning Station",
  ways_title: "Multiple Ways to Learn",
  web_mobile: "Web & Mobile",
  web_mobile_desc:
    "Full-featured app with AI tutoring, OCR for handwritten questions, and progress tracking.",
  sms_mode: "SMS Mode",
  sms_mode_desc:
    "Ask questions via text message from any phone. Perfect for feature phone users.",
  voice_calls: "Voice Calls",
  voice_calls_desc:
    "Interactive voice response system for audio-based learning and questions.",
  community_stations: "Community Stations",
  community_stations_desc:
    "Physical learning stations in communities for collaborative learning.",
  features_title: "Powerful Features",
  feature_ai: "AI-Powered Tutoring",
  feature_ai_desc:
    "Advanced AI understands questions in multiple languages and provides personalized explanations.",
  feature_teachers: "Teacher Network",
  feature_teachers_desc:
    "Connect with qualified teachers for complex questions and personalized guidance.",
  feature_scholar: "Scholarship Alerts",
  feature_scholar_desc:
    "Get notified about relevant scholarships and government schemes for education.",
  // Auth common
  login_title: "Welcome Back",
  login_desc: "Enter your phone number to access your learning dashboard",
  phone_number: "Phone Number",
  sign_in: "Sign In",
  register_here: "Register here",
  already_account: "Don't have an account?",
  // Footer
  footer_tagline:
    "Making quality education accessible to everyone, everywhere.",
  footer_access_methods: "Access Methods",
  footer_web_app: "Web Application",
  footer_sms_text: "SMS: Text to",
  footer_call_text: "Call:",
  footer_community_stations: "Community Stations",
  footer_support: "Support",
  footer_help_center: "Help Center",
  footer_contact_us: "Contact Us",
  footer_privacy_policy: "Privacy Policy",
  footer_terms_of_service: "Terms of Service",
  footer_copyright: "Bridging the digital education divide.",
};

const pa: Dict = {
  app_name: "ਕਲਾਸਲੈੱਸ",
  navbar_dashboard: "ਡੈਸ਼ਬੋਰਡ",
  navbar_ask: "ਸਵਾਲ ਪੁੱਛੋ",
  navbar_quiz: "ਕੁਇਜ਼",
  navbar_career: "ਕੈਰੀਅਰ ਗਾਈਡੈਂਸ",
  hero_title1: "ਸਰਿਆਂ ਲਈ AI ਅਧਿਆਪਕ",
  hero_title2: "ਹਰ ਵਿਦਿਆਰਥੀ ਲਈ",
  hero_desc:
    "ਬਹੁਭਾਸ਼ੀਏ AI ਟਿਊਟੋਰ ਨਾਲ ਸਿੱਖਿਆ ਵਿੱਚ ਆ ਰਹੀਆਂ ਰੁਕਾਵਟਾਂ ਨੂੰ ਦੂਰ ਕਰੋ — ਵੈੱਬ, SMS, ਆਵਾਜ਼ ਕਾਲਾਂ ਅਤੇ ਕਮਿਊਨਿਟੀ ਸਟੇਸ਼ਨਾਂ ਰਾਹੀਂ ਉਪਲਬਧ.",
  start_learning_now: "ਹੁਣੇ ਸਿੱਖਣਾ ਸ਼ੁਰੂ ਕਰੋ",
  find_learning_station: "ਲਰਨਿੰਗ ਸਟੇਸ਼ਨ ਲੱਭੋ",
  ways_title: "ਸਿੱਖਣ ਦੇ ਕਈ ਤਰੀਕੇ",
  web_mobile: "ਵੈੱਬ ਅਤੇ ਮੋਬਾਈਲ",
  web_mobile_desc:
    "AI ਟਿਊਟੋਰਿੰਗ, ਹੱਥ-ਲਿਖਤ ਲਈ OCR ਅਤੇ ਪ੍ਰਗਤੀ ਟਰੈਕਿੰਗ ਵਾਲਾ ਪੂਰਾ ਐਪ.",
  sms_mode: "SMS ਮੋਡ",
  sms_mode_desc:
    "ਕਿਸੇ ਵੀ ਫੋਨ ਤੋਂ ਮੇਸੇਜ ਰਾਹੀਂ ਸਵਾਲ ਪੁੱਛੋ — ਫੀਚਰ ਫੋਨ ਵਰਤੋਂਕਾਰਾਂ ਲਈ ਵਧੀਆ.",
  voice_calls: "ਆਵਾਜ਼ ਕਾਲਾਂ",
  voice_calls_desc: "ਆਡਿਓ-ਅਧਾਰਿਤ ਸਿੱਖਣ ਅਤੇ ਸਵਾਲਾਂ ਲਈ IVR ਪ੍ਰਣਾਲੀ.",
  community_stations: "ਕਮਿਊਨਿਟੀ ਸਟੇਸ਼ਨ",
  community_stations_desc: "ਸਹਿਯੋਗੀ ਸਿੱਖਿਆ ਲਈ ਸਮੂਹਕ ਸਟੇਸ਼ਨ.",
  features_title: "ਤਾਕਤਵਰ ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ",
  feature_ai: "AI-ਸੰਚਾਲਤ ਟਿਊਟੋਰਿੰਗ",
  feature_ai_desc:
    "ਉੱਚ-ਸਤ੍ਹਾ AI ਕਈ ਭਾਸ਼ਾਵਾਂ ਵਿੱਚ ਸਵਾਲ ਸਮਝਦਾ ਹੈ ਅਤੇ ਨਿੱਜੀ ਵਿਆਖਿਆ ਦਿੰਦਾ ਹੈ.",
  feature_teachers: "ਅਧਿਆਪਕ ਨੈੱਟਵਰਕ",
  feature_teachers_desc: "ਪੇਚੀਦਾ ਸਵਾਲਾਂ ਲਈ ਯੋਗ ਅਧਿਆਪਕਾਂ ਨਾਲ ਜੁੜੋ.",
  feature_scholar: "ਸਕਾਲਰਸ਼ਿਪ ਸੁਚਨਾਵਾਂ",
  feature_scholar_desc:
    "ਸੰਬੰਧਤ ਸਕਾਲਰਸ਼ਿਪਾਂ ਅਤੇ ਸਰਕਾਰੀ ਯੋਜਨਾਵਾਂ ਬਾਰੇ ਸੂਚਿਤ ਰਹੋ.",
  // Auth common
  login_title: "ਵਾਪਸ ਸਵਾਗਤ ਹੈ",
  login_desc: "ਆਪਣਾ ਡੈਸ਼ਬੋਰਡ ਖੋਲ੍ਹਣ ਲਈ ਫੋਨ ਨੰਬਰ ਦਰਜ ਕਰੋ",
  phone_number: "ਫੋਨ ਨੰਬਰ",
  sign_in: "ਸਾਇਨ ਇਨ",
  register_here: "ਇੱਥੇ ਰਜਿਸਟਰ ਕਰੋ",
  already_account: "ਖਾਤਾ ਨਹੀਂ ਹੈ?",
  // Footer
  footer_tagline: "ਹਰ ਕਿਸੇ ਲਈ, ਹਰ ਜਗ੍ਹਾ ਗੁਣਵੱਤਾਪੂਰਨ ਸਿੱਖਿਆ ਨੂੰ ਸੁਲਭ ਬਣਾਉਣਾ।",
  footer_access_methods: "ਪਹੁੰਚ ਦੇ ਤਰੀਕੇ",
  footer_web_app: "ਵੈੱਬ ਐਪਲੀਕੇਸ਼ਨ",
  footer_sms_text: "SMS: ਇੱਥੇ ਭੇਜੋ",
  footer_call_text: "ਕਾਲ:",
  footer_community_stations: "ਕਮਿਊਨਿਟੀ ਸਟੇਸ਼ਨ",
  footer_support: "ਸਹਾਇਤਾ",
  footer_help_center: "ਸਹਾਇਤਾ ਕੇਂਦਰ",
  footer_contact_us: "ਸਾਡੇ ਨਾਲ ਸੰਪਰਕ ਕਰੋ",
  footer_privacy_policy: "ਗੁਪਤਤਾ ਨੀਤੀ",
  footer_terms_of_service: "ਸੇਵਾ ਦੀਆਂ ਸ਼ਰਤਾਂ",
  footer_copyright: "ਡਿਜੀਟਲ ਸਿੱਖਿਆ ਦੇ ਵਿਭਾਜਨ ਨੂੰ ਪੂਰਾ ਕਰਨਾ।",
};

const hi: Dict = {
  app_name: "क्लासलेस",
  navbar_dashboard: "डैशबोर्ड",
  navbar_ask: "प्रश्न पूछें",
  navbar_quiz: "क्विज़",
  navbar_career: "कैरियर मार्गदर्शन",
  hero_title1: "सबके लिए AI ट्यूटर",
  hero_title2: "हर छात्र के लिए",
  hero_desc:
    "बहुभाषीय AI ट्यूशन के साथ शिक्षा की बाधाओं को दूर करें — वेब, SMS, वॉयस कॉल और सामुदायिक स्टेशनों पर उपलब्ध.",
  start_learning_now: "अभी सीखना शुरू करें",
  find_learning_station: "लर्निंग स्टेशन खोजें",
  ways_title: "सीखने के कई तरीके",
  web_mobile: "वेब और मोबाइल",
  web_mobile_desc:
    "AI ट्यूशन, हस्तलिखित के लिए OCR और प्रगति ट्रैकिंग वाला पूर्ण ऐप.",
  sms_mode: "SMS मोड",
  sms_mode_desc:
    "किसी भी फोन से संदेश द्वारा प्रश्न पूछें — फीचर फोन उपयोगकर्ताओं के लिए उपयुक्त.",
  voice_calls: "वॉयस कॉल",
  voice_calls_desc: "ऑडियो-आधारित सीखने और प्रश्नों के लिए IVR प्रणाली.",
  community_stations: "सामुदायिक स्टेशन",
  community_stations_desc: "सहयोगी सीखने के लिए सामुदायिक स्टेशन.",
  features_title: "शक्तिशाली विशेषताएँ",
  feature_ai: "AI संचालित ट्यूशन",
  feature_ai_desc:
    "उन्नत AI कई भाषाओं में प्रश्न समझता है और व्यक्तिगत व्याख्या प्रदान करता है.",
  feature_teachers: "शिक्षक नेटवर्क",
  feature_teachers_desc: "जटिल प्रश्नों के लिए योग्य शिक्षकों से जुड़ें.",
  feature_scholar: "स्कॉलरशिप अलर्ट",
  feature_scholar_desc:
    "प्रासंगिक छात्रवृत्तियों और सरकारी योजनाओं के बारे में सूचित रहें.",
  // Auth common
  login_title: "वापसी पर स्वागत है",
  login_desc: "अपना डैशबोर्ड खोलने के लिए फ़ोन नंबर दर्ज करें",
  phone_number: "फ़ोन नंबर",
  sign_in: "साइन इन",
  register_here: "यहाँ रजिस्टर करें",
  already_account: "खाता नहीं है?",
  // Footer
  footer_tagline: "सभी के लिए, हर जगह गुणवत्तापूर्ण शिक्षा को सुलभ बनाना।",
  footer_access_methods: "पहुंच के तरीके",
  footer_web_app: "वेब एप्लिकेशन",
  footer_sms_text: "SMS: यहाँ भेजें",
  footer_call_text: "कॉल:",
  footer_community_stations: "सामुदायिक स्टेशन",
  footer_support: "सहायता",
  footer_help_center: "सहायता केंद्र",
  footer_contact_us: "हमसे संपर्क करें",
  footer_privacy_policy: "गोपनीयता नीति",
  footer_terms_of_service: "सेवा की शर्तें",
  footer_copyright: "डिजिटल शिक्षा के विभाजन को पूरा करना।",
};

const ta: Dict = {
  app_name: "க்ளாஸ்லெஸ்",
  navbar_dashboard: "பலகை",
  navbar_ask: "கேள்வி கேள்",
  navbar_quiz: "வினாடி வினா",
  navbar_career: "தொழில் வழிகாட்டல்",
  hero_title1: "அனைவருக்கும் AI ஆசிரியர்",
  hero_title2: "அனைத்து மாணவர்களுக்கும்",
  hero_desc:
    "பலமொழி AI கற்றலுடன் கல்வித் தடைங்களை நீக்குங்கள் — வலை, SMS, குரல் அழைப்புகள் மற்றும் சமூக நிலையங்கள்.",
  start_learning_now: "இப்போதே தொடங்கு",
  find_learning_station: "லெர்னிங் ஸ்டேஷன் தேடு",
  ways_title: "பல கற்றல் வழிகள்",
  web_mobile: "இணையம் & மொபைல்",
  web_mobile_desc:
    "AI டியூட்டர், கைஎழுத்து OCR மற்றும் முன்னேற்ற கண்காணிப்புடன் முழு அம்சங்கள்.",
  sms_mode: "SMS முறை",
  sms_mode_desc:
    "எந்த தொலைபேசியில் இருந்தும் செய்தியால் கேள்வி கேளுங்கள் — ஃபீச்சர் போன்களுக்கு ஏற்றது.",
  voice_calls: "குரல் அழைப்புகள்",
  voice_calls_desc: "குரல் அடிப்படையிலான கற்றலுக்கும் கேள்விகளுக்கும் IVR.",
  community_stations: "சமூக நிலையங்கள்",
  community_stations_desc: "கூட்டு கற்றலுக்கான நிலையங்கள்.",
  features_title: "சக்திவாய்ந்த அம்சங்கள்",
  feature_ai: "AI உதவியுடன் கற்றல்",
  feature_ai_desc:
    "மேம்பட்ட AI பல மொழிகளில் கேள்விகளை புரிந்து தனிப்பட்ட விளக்கங்களை வழங்கும்.",
  feature_teachers: "ஆசிரியர் வலை",
  feature_teachers_desc: "சிக்கலான கேள்விகளுக்கு தகுதியான ஆசிரியர்களுடன் இணைக.",
  feature_scholar: "உதவித்தொகை அறிவிப்புகள்",
  feature_scholar_desc:
    "தொடர்புடைய உதவித்தொகைகள் மற்றும் அரசு திட்டங்களை அறிந்து கொள்ளுங்கள்.",
  // Auth common
  login_title: "மீண்டும் வரவேற்கிறோம்",
  login_desc: "டாஷ்போர்டை அணுக உங்கள் தொலைபேசி எண்ணை உள்ளிடுங்கள்",
  phone_number: "தொலைபேசி எண்",
  sign_in: "சைன் இன்",
  register_here: "இங்கே பதிவு செய்யவும்",
  already_account: "கணக்கு இல்லையா?",
  // Footer
  footer_tagline:
    "எல்லோருக்கும், எல்லா இடங்களிலும் தரமான கல்வியை அணுகக்கூடியதாக்குதல்.",
  footer_access_methods: "அணுகல் முறைகள்",
  footer_web_app: "வலை பயன்பாடு",
  footer_sms_text: "SMS: இங்கே அனுப்பவும்",
  footer_call_text: "அழைப்பு:",
  footer_community_stations: "சமூக நிலையங்கள்",
  footer_support: "ஆதரவு",
  footer_help_center: "உதவி மையம்",
  footer_contact_us: "எங்களைத் தொடர்பு கொள்ளுங்கள்",
  footer_privacy_policy: "தனியுரிமை கொள்கை",
  footer_terms_of_service: "சேவை விதிமுறைகள்",
  footer_copyright: "டிஜிட்டல் கல்வி பிரிவினையை நிறைவேற்றுதல்.",
};

const dictMap: Record<Lang, Dict> = { en, pa, hi, ta };

export function t(lang: Lang, key: string, fallback?: string) {
  const d = dictMap[lang] || en;
  return d[key] || fallback || key;
}
