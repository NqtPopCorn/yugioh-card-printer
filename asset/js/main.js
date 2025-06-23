const { jsPDF } = window.jspdf;
const urlList = [];
const container = document.getElementById("card-container");
const btnSaveLocal = document.getElementById("save-local-btn");

function clearCards() {
    if (confirm("Bạn có chắc chắn muốn xóa tất cả các thẻ không?")) {
        urlList.length = 0; // Clear the array
        renderCards(); // Re-render the cards
    }
}

function addCard(num) {
    const input = document.getElementById("img-url");
    const url = input.value.trim();
    if (url) {
        for (let i = 0; i < num; i++) {
            urlList.push(url);
        }
        renderCards();
    } else {
        alert("Vui lòng nhập URL ảnh hợp lệ.");
    }
}

function renderCards() {
    container.innerHTML = "";
    urlList.forEach((url, index) => {
        const div = document.createElement("div");
        div.className = "card";
        div.style.backgroundImage = `url(${url})`;

        // Handle both right-click and long press for mobile
        div.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            urlList.splice(index, 1);
            renderCards();
        });

        // Long press for mobile devices
        let pressTimer;
        div.addEventListener("touchstart", (e) => {
            pressTimer = setTimeout(() => {
                urlList.splice(index, 1);
                renderCards();
            }, 800);
        });

        div.addEventListener("touchend", () => {
            clearTimeout(pressTimer);
        });

        div.addEventListener("touchmove", () => {
            clearTimeout(pressTimer);
        });

        container.appendChild(div);
    });
}

async function exportPDF() {
    if (urlList.length === 0) {
        alert("Vui lòng thêm ít nhất một thẻ trước khi xuất PDF.");
        return;
    }

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });
    const cardW = 59,
        cardH = 86;
    let x = 10,
        y = 10;

    try {
        for (let i = 0; i < urlList.length; i++) {
            const img = await loadImage(urlList[i]);
            pdf.addImage(img, "JPEG", x, y, cardW, cardH);

            x += cardW;
            if (x + cardW > 210) {
                x = 10;
                y += cardH;
            }
            if (y + cardH > 297) {
                pdf.addPage();
                x = 10;
                y = 10;
            }
        }

        pdf.save("yugioh-cards.pdf");
    } catch (error) {
        alert("Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại.");
        console.error("PDF Export Error:", error);
    }
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/jpeg", 1.0));
        };
        img.onerror = reject;
        img.src = url;
    });
}

// Handle paste from clipboard
document.addEventListener("paste", async (e) => {
    const items = e.clipboardData.items;
    for (let item of items) {
        // Check if the item is an image
        if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            const reader = new FileReader();
            reader.onload = () => {
                urlList.push(reader.result);
                renderCards();
            };
            reader.readAsDataURL(file);
        }
    }
});

// Handle Enter key in input field
document.getElementById("img-url").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        addCard(1);
    }
});

// auto save local storage on refresh
// window.addEventListener("beforeunload", () => {
//     localStorage.setItem("yugiohCardUrls", JSON.stringify(urlList));
// });

// sava on click btn
function handleSaveLocal() {
    try {
        localStorage.setItem("yugiohCardUrls", JSON.stringify(urlList));
    } catch (error) {
        alert(
            "Không thể lưu local nhiều 'ảnh được dán trực tiếp', hãy thử bằng đường dẫn hoặc xuất PDF để lưu lại các thẻ của bạn."
        );
        return;
    }
    alert("Đã lưu thành công vào Local Storage!");
}

window.addEventListener("load", () => {
    const savedUrls = localStorage.getItem("yugiohCardUrls");
    if (savedUrls) {
        urlList.push(...JSON.parse(savedUrls));
        renderCards();
    }
});
