const btn = document.getElementById("task2Btn");
const classes = document.getElementById("classes");

btn.addEventListener("click", function () {
    btn.classList.toggle("active");
    console.log(btn.classList);
    classes.textContent = btn.className;
});