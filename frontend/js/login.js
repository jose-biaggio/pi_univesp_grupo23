function togglePassword() {
    const password = document.getElementById("password");
    const eye = document.getElementById("eye");

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
    .addEventListener("submit", async function (e) {
        e.preventDefault();

        const usuarioInput = document.getElementById("usuario");
        const senhaInput = document.getElementById("password");
        const btnEntrar = document.getElementById("btnEntrar");
        const msgErro = document.getElementById("mensagemErro");

        const usuario = usuarioInput.value.trim();
        const senha = senhaInput.value;

        msgErro.classList.add("d-none");
        msgErro.textContent = "";
        btnEntrar.disabled = true;
        btnEntrar.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i>Entrando...';

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    usuario: usuario,
                    senha: senha,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("token_type", data.token_type);
                localStorage.setItem("usuario_logado", JSON.stringify(data.usuario));
                window.location.href = "apontamentos.html";
            } else {
                let erroTexto = "Dados inválidos.";
                if (data && data.detail) {
                    erroTexto = typeof data.detail === "string" ? data.detail : "Dados inválidos.";
                }
                msgErro.textContent = erroTexto;
                msgErro.classList.remove("d-none");
            }
        } catch (error) {
            msgErro.textContent = "Erro ao conectar com o servidor. Verifique sua conexão.";
            msgErro.classList.remove("d-none");
        } finally {
            btnEntrar.disabled = false;
            btnEntrar.innerHTML = 'Entrar <i class="fa-solid fa-arrow-right ms-2"></i>';
        }
    });