(function () {
    const btn = document.getElementById("task2Btn");
    const classes = document.getElementById("classes");

    if (!btn || !classes) return;

    btn.addEventListener("click", function () {
        btn.classList.toggle("active");

        console.log(btn.className);
        classes.textContent = btn.className;
    });
})();