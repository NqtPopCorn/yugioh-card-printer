const { jsPDF } = window.jspdf;
const urlList = [];
let selectedIndex = null;
const container = document.getElementById("card-container");
const btnSaveLocal = document.getElementById("save-local-btn");
const imageForm = document.getElementById("image-form");
const urlInput = document.getElementById("img-url");
const sidebar = document.getElementById("sidebar");
const contextMenu = document.getElementById("context-menu");
const cardWidthInput = document.getElementById("cardWidth");
const cardHeightInput = document.getElementById("cardHeight");
const cardFormatSelect = document.getElementById("cardFormat");
const formatSizes = {
    "59x86": { width: 59, height: 86 },
};

// Handle form submission to add card
imageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addCard(1);
});

function clearCards() {
    if (confirm("Bạn có chắc chắn muốn xóa tất cả các thẻ không?")) {
        urlList.length = 0; // Clear the array
        renderCards(); // Re-render the cards
    }
}

function addCard(num) {
    const url = urlInput.value.trim();
    if (url) {
        const lastIndex = urlList.length;
        for (let i = 0; i < num; i++) {
            urlList.push(url);
            renderCard(url, lastIndex + i); // Pass the correct index
        }
    } else {
        alert("Vui lòng nhập URL ảnh hợp lệ.");
    }
}

function renderCard(url, index) {
    const div = document.createElement("div");
    div.className = "card";
    div.style.backgroundImage = `url(${url})`;

    // Handle both right-click and long press for mobile
    // Thêm event chuột phải
    div.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        selectedIndex = index;
        showContextMenu(e.pageX, e.pageY);
    });

    // Long press for mobile devices
    let pressTimer;
    div.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            pressTimer = setTimeout(() => {
                selectedIndex = index;

                const touch = e.touches[0];
                showContextMenu(touch.pageX, touch.pageY);
            }, 800);
        }
    });

    div.addEventListener("touchend", () => {
        clearTimeout(pressTimer);
    });

    div.addEventListener("touchmove", () => {
        clearTimeout(pressTimer);
    });

    container.appendChild(div);
}

function renderCards(startAt = 0) {
    container.innerHTML = "";
    urlList.slice(startAt).forEach((url, index) => {
        renderCard(url, index);
    });
}

async function exportPDF() {
    if (urlList.length === 0) {
        alert("Vui lòng thêm ít nhất một thẻ trước khi xuất PDF.");
        return;
    }
    if (urlList.length % 9 !== 0) {
        if (
            !confirm(
                `Chưa đủ thẻ cho trang a4 cuối, bạn nên thêm ${
                    9 - (urlList.length % 9)
                } thẻ nữa! Vẫn tiếp tục xuất PDF?`
            )
        ) {
            return;
        }
    }
    //confirm card num
    if (!confirm(`Bạn có chắc chắn muốn xuất ${urlList.length} thẻ không?`)) {
        return;
    }

    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });
    const cardW = parseFloat(cardWidthInput.value) || 59;
    const cardH = parseFloat(cardHeightInput.value) || 86;
    let gap = 0;
    let x = 10,
        y = 10;

    try {
        for (let i = 0; i < urlList.length; i++) {
            const img = await loadImage(urlList[i]);
            pdf.addImage(img, "JPEG", x, y, cardW, cardH);

            x += cardW + gap;
            if (x + cardW > 210) {
                x = 10;
                y += cardH + gap;
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
        // resolve(document.getElementById("test-card"));
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

// save on click btn
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

function showContextMenu(x, y) {
    const menu = contextMenu;
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.remove("hidden");
}

document.addEventListener("click", () => {
    contextMenu.classList.add("hidden");
});

function handleDelete() {
    if (selectedIndex !== null) {
        urlList.splice(selectedIndex, 1);
        renderCards();
        selectedIndex = null;
    }
    contextMenu.classList.add("hidden");
}

function handleDuplicate() {
    if (selectedIndex !== null) {
        urlList.push(urlList[selectedIndex]);
        renderCards();
        selectedIndex = null;
    }
    contextMenu.classList.add("hidden");
}

// Add event listeners
cardWidthInput.addEventListener("input", (e) => {
    const format = cardFormatSelect.value;
    if (formatSizes[format]) {
        cardHeightInput.value = (
            (e.target.value * formatSizes[format].height) /
            formatSizes[format].width
        ).toFixed(2);
        console.log(
            `Width: ${e.target.value}, Height: ${cardHeightInput.value}`
        );
    }
});
cardHeightInput.addEventListener("input", (e) => {
    const format = cardFormatSelect.value;
    console.log(`format: ${format}`);
    if (formatSizes[format]) {
        cardWidthInput.value = (
            (e.target.value * formatSizes[format].width) /
            formatSizes[format].height
        ).toFixed(2);
        console.log(
            `Height: ${e.target.value}, Width: ${cardWidthInput.value}`
        );
    }
});
