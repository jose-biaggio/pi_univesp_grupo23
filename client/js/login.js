function togglePassword() {

    const password =
        document.getElementById("password");

    const eye =
        document.getElementById("eye");

    if (password.type === "password") {

        password.type = "text";

        eye.classList.remove("fa-eye");
        eye.classList.add("fa-eye-slash");

    } else {

        password.type = "password";

        eye.classList.remove("fa-eye-slash");
        eye.classList.add("fa-eye");
    }
}

document
.getElementById("loginForm")
.addEventListener("submit", function (e) {

    e.preventDefault();

    alert("Login realizado com sucesso!");
});