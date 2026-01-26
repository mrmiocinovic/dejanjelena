document.addEventListener("DOMContentLoaded", () => {
  // ======= COUNTDOWN =======
  const targetDate = new Date("May 2, 2026 14:00:00").getTime();
  const countdown = document.getElementById("countdown");

  function updateCountdown() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff <= 0) {
      countdown.innerHTML =
        "<h3 class='love-header'>Danas slavimo ljubav 🤍</h3>";
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    countdown.innerHTML = `
      <div class="cd-box">
        <div class="cd-number">${days}</div>
        <div class="cd-label">dana</div>
      </div>
      <div class="cd-box">
        <div class="cd-number">${hours}</div>
        <div class="cd-label">sati</div>
      </div>
      <div class="cd-box">
        <div class="cd-number">${minutes}</div>
        <div class="cd-label">minuta</div>
      </div>
      <div class="cd-box">
        <div class="cd-number">${seconds}</div>
        <div class="cd-label">sekundi</div>
      </div>
    `;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  const form = document.getElementById("rsvp-form");
  const guestsInput = form.querySelector("input[type='number']");
  const attendanceSelect = form.querySelector("select");
  const submitBtn = form.querySelector("button");

  if (attendanceSelect.value.includes("ne")) {
    guestsInput.style.display = "none";
    guestsInput.required = false;
  }

  attendanceSelect.addEventListener("change", () => {
    if (attendanceSelect.value.includes("ne")) {
      guestsInput.style.display = "none";
      guestsInput.required = false;
    } else {
      guestsInput.style.display = "block";
      guestsInput.required = true;
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let attendanceRaw = attendanceSelect.value.toLowerCase();
    let attendance = "";
    if (attendanceRaw.includes("da")) attendance = "da";
    else if (attendanceRaw.includes("ne")) attendance = "ne";

    const data = {
      name: document.getElementById("rsvp-name").value,
      attendance,
      guests: guestsInput.value,
      message: form.querySelector("textarea").value,
      website: form.querySelector("input[name='website']")?.value || "",
    };

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Šaljem... ⏳";

    try {
      console.log("RSVP data:", data);

      const res = await fetch("/api/send-rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      form.reset();

      if (res.ok) showRSVPModal(data.attendance);
      else alert("Došlo je do greške. Pokušajte kasnije.");
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      alert("Server trenutno nije dostupan.");
    }
  });

  function showRSVPModal(attendance) {
    const existing = document.querySelector(".rsvp-modal");
    if (existing) existing.remove();

    const isYes = attendance.toLowerCase().includes("da");

    const modal = document.createElement("div");
    modal.className = "rsvp-modal";
    modal.style.display = "flex";
    modal.innerHTML = `
      <div class="rsvp-modal-content ${isYes ? "yes" : "no"}">
        <span class="close-btn">&times;</span>
        <h2>${isYes ? "Hvala što dolazite! 🤍" : "Vaš odgovor je primljen"}</h2>
        <p>${isYes ? "Radujemo se što ćemo vas videti na našem venčanju!" : "Hvala na obaveštenju 💛"}</p>
        ${isYes ? '<div class="confetti"></div>' : ""}
      </div>
    `;

    document.body.appendChild(modal);

    modal
      .querySelector(".close-btn")
      .addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });

    if (isYes) launchConfetti(modal.querySelector(".confetti"));
    setTimeout(() => modal.remove(), 6000);
  }

  function launchConfetti() {
    const overlay = document.createElement("div");
    overlay.className = "confetti-overlay";
    document.body.appendChild(overlay);

    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti-piece";
      confetti.style.left = Math.random() * 100 + "vw";
      confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 80%, 60%)`;
      confetti.style.width = 5 + Math.random() * 10 + "px";
      confetti.style.height = 5 + Math.random() * 10 + "px";
      confetti.style.animationDuration = 3 + Math.random() * 3 + "s";
      overlay.appendChild(confetti);
      confetti.addEventListener("animationend", () => confetti.remove());
    }

    setTimeout(() => overlay.remove(), 6000);
  }

  document.querySelectorAll("input[required]").forEach((input) => {
    input.addEventListener("invalid", () =>
      input.setCustomValidity("Molimo popunite ovo polje"),
    );
    input.addEventListener("input", () => input.setCustomValidity(""));
  });
});
