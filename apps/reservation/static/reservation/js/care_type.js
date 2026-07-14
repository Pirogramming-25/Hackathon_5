const departments = [
  {
    name: "내과",
    symptoms: ["감기·독감", "소화기 질환", "고혈압·당뇨", "호흡기 질환", "건강검진 상담"],
  },
  {
    name: "정형외과",
    symptoms: ["허리 통증", "목 통증", "관절염", "스포츠 손상", "골절 치료"],
  },
  {
    name: "피부과",
    symptoms: ["여드름 치료", "아토피 피부염", "알레르기 피부질환", "사마귀·티눈", "피부 검진"],
  },
  {
    name: "소아청소년과",
    symptoms: ["영유아 진료", "예방접종", "성장 상담", "알레르기 진료", "소아 감기"],
  },
  {
    name: "치과",
    symptoms: ["충치 치료", "스케일링", "임플란트 상담", "치아교정 상담", "사랑니 발치"],
  },
  {
    name: "산부인과",
    symptoms: ["여성 건강검진", "임신 진료", "산전검사", "생리 불순 상담", "갱년기 상담"],
  },
];

const deptTabs = document.getElementById("deptTabs");
const symptomList = document.getElementById("symptomList");
const confirmBtn = document.getElementById("confirmCare");

let activeDeptIndex = 0;
const selectedSymptoms = {};
departments.forEach((dept) => {
  selectedSymptoms[dept.name] = new Set();
});

function renderTabs() {
  deptTabs.innerHTML = "";
  departments.forEach((dept, index) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "dept-tab";
    if (index === activeDeptIndex) tab.classList.add("active");
    tab.textContent = dept.name;
    tab.addEventListener("click", () => {
      activeDeptIndex = index;
      renderTabs();
      renderSymptoms();
    });
    deptTabs.appendChild(tab);
  });
}

function updateConfirmState() {
  const hasAny = departments.some((dept) => selectedSymptoms[dept.name].size > 0);
  confirmBtn.disabled = !hasAny;
}

function renderSymptoms() {
  symptomList.innerHTML = "";
  const dept = departments[activeDeptIndex];

  dept.symptoms.forEach((symptom) => {
    const item = document.createElement("div");
    item.className = "symptom-item";
    if (selectedSymptoms[dept.name].has(symptom)) item.classList.add("checked");

    const check = document.createElement("span");
    check.className = "symptom-check";
    check.innerHTML =
      '<svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="M5 12l5 5L19 7" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    const label = document.createElement("span");
    label.textContent = symptom;

    item.appendChild(check);
    item.appendChild(label);

    item.addEventListener("click", () => {
      if (selectedSymptoms[dept.name].has(symptom)) {
        selectedSymptoms[dept.name].delete(symptom);
      } else {
        selectedSymptoms[dept.name].add(symptom);
      }
      renderSymptoms();
      updateConfirmState();
    });

    symptomList.appendChild(item);
  });
}

confirmBtn.addEventListener("click", () => {
  const nextUrl = confirmBtn.dataset.nextUrl;
  window.location.href = nextUrl;
});

renderTabs();
renderSymptoms();
