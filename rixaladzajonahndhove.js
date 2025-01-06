//code for icon fade-in
const items = document.querySelectorAll(".grid-item");

document.addEventListener("scroll", function() {
    items.forEach((item) => {
        if(isVisible(item)) {
            item.classList.add("grid-item-visible");
        }
        if(!isVisible(item)) {
            item.classList.remove("grid-item-visible");
        }
    });
})

function isVisible(elem) {
    const rect = elem.getBoundingClientRect();
    return (rect.bottom > 0 && rect.top < (window.innerHeight - 150 || document.documentElement.clientHeight - 150));
}
//end of code for icon fade-in

//
document.getElementById("aboutLink").onclick = function() {

}
//