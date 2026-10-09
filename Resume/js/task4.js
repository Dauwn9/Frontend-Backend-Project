const themeButton = document.getElementById("themeButton");

function applyTheme(isDark) {
    document.body.classList.toggle("dark-theme", isDark);

    if (isDark) {
        themeButton.textContent = "Светлая тема";
    } else {
        themeButton.textContent = "Темная тема";
    }
}

// Загружаем сохранённую тему
const savedTheme = localStorage.getItem("theme");

applyTheme(savedTheme === "dark");

// Нажатие на кнопку
themeButton.addEventListener("click", function () {

    const isDark = document.body.classList.contains("dark-theme");

    applyTheme(!isDark);

    localStorage.setItem(
        "theme",
        !isDark ? "dark" : "light"
    );
});