// ============================================================
// Firebase Config - WaitList Smooziee
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyDiVI7kJ8mbXbK3doNDTc8hiilkHnJUFSY",
  authDomain: "waitlist-smooziee.firebaseapp.com",
  projectId: "waitlist-smooziee",
  storageBucket: "waitlist-smooziee.firebasestorage.app",
  messagingSenderId: "362626440005",
  appId: "1:362626440005:web:720c58b9e60782f6eafc2c",
  measurementId: "G-LBHJYBXS4M"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

async function checkWaitlistStatus() {
  try {
    const snap = await db.collection("settings").doc("waitlist").get();
    if (snap.exists && snap.data().isOpen === false) return false;
    return true;
  } catch (e) {
    console.error("Error checking waitlist status:", e);
    return true;
  }
}

async function initWaitlistUI() {
  const isOpen = await checkWaitlistStatus();
  if (!isOpen) {
    const formContainer = document.querySelector('.form-container');
    if (formContainer) {
      formContainer.innerHTML = `
        <div style="text-align:center;padding:80px 20px;">
          <div style="font-size:60px;margin-bottom:20px;">🔒</div>
          <h2 style="color:#7b2cbf;font-size:32px;font-weight:bold;font-family:'Tajawal',sans-serif;margin-bottom:15px;">
            قائمة الانتظار مغلقة حالياً
          </h2>
          <p style="font-size:18px;color:#555;font-family:'Tajawal',sans-serif;">
            ترقبي الفتح القادم قريباً! 🌸
          </p>
        </div>`;
    }
  }
}

document.getElementById('waitlistForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  clearErrors();

  const isOpen = await checkWaitlistStatus();
  if (!isOpen) { alert("عذراً، قائمة الانتظار مغلقة حالياً."); return; }

  let isValid = true;

  const emailInput = document.getElementById('email');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(emailInput.value.trim())) {
    showError('emailError', 'من فضلك أدخلي إيميل صحيح');
    emailInput.classList.add('error');
    isValid = false;
  }

  const phoneInput = document.getElementById('phone');
  const phoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;
  if (!phoneRegex.test(phoneInput.value.trim())) {
    showError('phoneError', 'من فضلك أدخلي رقم موبايل مصري صحيح (11 رقم)');
    phoneInput.classList.add('error');
    isValid = false;
  }

  const radioGroups = ['hairType', 'hairCare', 'brushImportance'];
  let allAnswered = true;
  radioGroups.forEach(group => {
    if (!document.querySelector(`input[name="${group}"]:checked`)) {
      allAnswered = false;
      isValid = false;
    }
  });
  if (!allAnswered) { alert('من فضلك أجيبي على جميع الأسئلة'); return; }

  const priceInput = document.querySelector('input[name="priceGuess"]');
  if (!priceInput?.value?.trim()) {
    priceInput?.classList.add('error');
    isValid = false;
  } else {
    const convertedPrice = convertArabicDigits(priceInput.value.trim());
    if (!/^[0-9]+$/.test(convertedPrice)) {
      priceInput.classList.add('error');
      showError('priceGuessError', 'اكتب أرقام فقط');
      isValid = false;
    } else {
      priceInput.value = convertedPrice;
    }
  }

  if (!isValid) return;

  const brushVal = document.querySelector('input[name="brushImportance"]:checked')?.value;
  const priceVal = parseInt(priceInput.value.trim());
  const isAccepted = (brushVal === 'أكيد') && (!isNaN(priceVal) && priceVal > 300);

  const formData = {
    hairType: document.querySelector('input[name="hairType"]:checked')?.value,
    hairCare: document.querySelector('input[name="hairCare"]:checked')?.value,
    brushImportance: brushVal,
    priceGuess: priceInput.value.trim(),
    phone: phoneInput.value.trim(),
    email: emailInput.value.trim(),
    status: isAccepted ? 'accepted' : 'rejected',
    submittedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري الإرسال...';

    await db.collection(isAccepted ? 'accepted_users' : 'rejected_users').add(formData);

    const formContainer = document.querySelector('.form-container');
    const waitlistSection = document.getElementById('waitlist-section');

    if (isAccepted) {
      formContainer.innerHTML = `
        <div style="text-align:center;padding:80px 20px;font-family:'Tajawal',sans-serif;">
          <div style="font-size:60px;margin-bottom:20px;">🎉</div>
          <h2 style="color:#7b2cbf;font-size:34px;margin-bottom:15px;font-weight:bold;">
            مبارك! تم قبولك في قائمة الانتظار ✨
          </h2>
          <p style="font-size:18px;color:#333;margin-bottom:25px;">يمكنك الآن الدخول إلى المتجر</p>
          <a href="https://cmgexhb19043101kn7yp0b1qr.wuiltstore.com/ar/shop"
             target="_blank"
             style="display:inline-block;padding:15px 40px;background:linear-gradient(135deg,#9b59b6,#7b2cbf);color:white;text-decoration:none;border-radius:12px;font-size:20px;font-weight:bold;box-shadow:0 4px 15px rgba(123,44,191,0.3);">
            ادخلي المتجر 🛍️
          </a>
        </div>`;
    } else {
      formContainer.innerHTML = `
        <div style="text-align:center;padding:80px 20px;font-family:'Tajawal',sans-serif;">
          <div style="font-size:60px;margin-bottom:20px;">💌</div>
          <h2 style="color:#7b2cbf;font-size:28px;margin-bottom:15px;font-weight:bold;">
            شكراً لتسجيلك! 🌸
          </h2>
          <p style="font-size:17px;color:#555;line-height:1.8;">
            تم استلام بياناتك بنجاح.<br> 💜
          </p>
        </div>`;
    }

    // ===== Scroll للنتيجة في نفس المكان =====
    if (waitlistSection) {
      waitlistSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

  } catch (error) {
    console.error("Firebase Error:", error);
    alert("حصل خطأ أثناء الإرسال ❌ حاولي تاني");
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'ارسال';
    }
  }
});

function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) el.textContent = message;
}

function clearErrors() {
  document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
  document.querySelectorAll('input').forEach(input => input.classList.remove('error'));
}

const arabicDigitsMap = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9' };
function convertArabicDigits(str) {
  return str.replace(/[٠-٩]/g, d => arabicDigitsMap[d]);
}

document.querySelectorAll('input').forEach(input => {
  input.addEventListener('input', function() {
    this.classList.remove('error');
    if (this.id === 'email') document.getElementById('emailError').textContent = '';
    if (this.id === 'phone') document.getElementById('phoneError').textContent = '';
  });
});

// ===== Numeric validation for priceGuess (English & Arabic digits) =====
const priceGuessInput = document.getElementById('priceGuess');
if (priceGuessInput) {
  priceGuessInput.addEventListener('input', function() {
    const original = this.value;
    const converted = convertArabicDigits(original);
    const onlyDigits = converted.replace(/[^0-9]/g, '');
    if (converted !== onlyDigits) {
      this.value = onlyDigits;
      showError('priceGuessError', 'اكتب أرقام فقط');
    } else {
      this.value = onlyDigits;
      document.getElementById('priceGuessError').textContent = '';
    }
  });
}

initWaitlistUI();

