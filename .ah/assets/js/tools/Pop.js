
class Popup extends BaseClass {
    constructor() {
        super();

        if (!$('body').hasClass('guest')) {
            this.initEvents();
        }
    }

    static open(id) {
        $('body').addClass('popup-open');
        $('#'+id).toggleClass('show');
    }

    close() {
        $('body').removeClass('popup-open');
        $('.popup.show').removeClass('show');
    }

    static close() {
        $('body').removeClass('popup-open');
        $('.popup.show').removeClass('show');
    }

    initEvents() {
        // Close on ESC key
        $(document).on('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        });

        // Toggle popup
        $('.popup .close-popup').on('click', (e) => {
            e.preventDefault();
            this.close();
        });

        $('.popup-overlay').on('click', (e) => {
            e.preventDefault();
            this.close();
        });

    }
}

new Popup();
window.Popup = Popup;