const toolItems = document.querySelectorAll('.tool-item');

toolItems.forEach((item) => {
    item.addEventListener('click', () => {
        
        toolItems.forEach((el) => el.classList.remove('active'));
        
        item.classList.add('active');

        const toolType = item.dataset.tool;
        console.log('선택된 도구:', toolType);

        
    });
});

const completeBtn = document.querySelector('.btn-complete');
if (completeBtn) {
    completeBtn.addEventListener('click', () => {
        // TODO: html2canvas로 캔버스 영역 캡처 후 채팅으로 전송
        alert('완료 버튼 클릭됨 (아직 캡처 기능 미구현)');
    });
}