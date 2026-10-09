export const Auth = {
    getToken: () => localStorage.getItem("access_token"),
    getUser: () => JSON.parse(localStorage.getItem("usuario_logado")),
    logout: () => {
        localStorage.clear();
        window.location.href = "login.html";
    },
    exigirAutenticacao: () => {
        if (!Auth.getToken()) {
            Auth.logout();
        }
    }
};