let msg = "hidden func called"
function unexposed() {
    console.log(msg);
}

export default function exposed() {
    unexposed();
}