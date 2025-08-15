
// Sidebar
class Account extends BaseClass {
    constructor() {
        super();

        this.$wrap = $('#my-account');

        this.subscribe('loadMyAccount', () => this.loadMyAccount());
        this.subscribe('unloadMyAccount', () => this.unloadMyAccount());

        this.initEvents();
    }

    initEvents() {
        $('#logout').on('click', () => this.logout());
        $('#edit_profile').on('click', () => this.editProfile());
        $('#change_pass').on('click', () => this.changePass());

        $('#edit_profile_save').on('click', () => this.saveProfile());
        $('#edit_pass_save').on('click', () => this.savePass());
    }

    loadMyAccount() {
        this.$wrap.addClass('open');
        this.$wrap.addClass('profile');
    }
    unloadMyAccount() {
        this.$wrap.removeClass('open');
    }

    editProfile() {
        this.$wrap.addClass('profile');
        this.$wrap.removeClass('password');
    }

    changePass() {
        this.$wrap.addClass('password');
        this.$wrap.removeClass('profile');
    }

    async saveProfile() {
        const $success = $('#profile_edit_success');
        const $error   = $('#profile_edit_error');

        $success.empty().hide();
        $error.empty().hide();

        const data = {
            email    : $('#user_email').val().trim(),
            firstName: $('#user_firstname').val().trim(),
            lastName : $('#user_lastname').val().trim(),
            language : $('#user_language').val().trim(),
            jobTitle : $('#user_jobTitle').val().trim(),
            bio      : $('#user_bio').val().trim(),
        };

        const requiredFields = ['email', 'firstName', 'lastName', 'language', 'jobTitle'];
        const missingFields = requiredFields
            .filter(key => !data[key])
            .map(key => key);

        if (missingFields.length > 0) {
            $error.text(`Please fill in the following fields: ${missingFields.join(', ')}`).show();
            return;
        }

        try {
            const response = await ApiCall.call('POST', '/api/v1/user/update-profile', data);
            if (response.status === 200) {
                $success.text('Profile successfully saved, window will refresh in 1sec').show();
                setTimeout(() => {
                    location.reload();
                    $success.fadeOut(150);
                }, 1000);
            } else {
                $error.text(`${response.message}`).show();
                setTimeout(() => {
                    $error.fadeOut(150);
                }, 2000);
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            $error.text('Error saving profile. Please try again.').show();
        }
    }

    async savePass() {
        const $success = $('#pass_edit_success');
        const $error   = $('#pass_edit_error');

        $success.empty().hide();
        $error.empty().hide();

        const data = {
            currentPass: $('#user_current_password').val().trim(),
            newPass    : $('#user_new_password').val().trim(),
            confirmPass: $('#user_confirm_password').val().trim(),
        }

        const missingFields = Object.entries(data)
            .filter(([_, value]) => !value)
            .map(([key]) => key);

        if (missingFields.length > 0) {
            $error.text(`Please fill in the following fields: ${missingFields.join(', ')}`).show();
            return;
        }

        // Check if new password is the same as current password
        if (data.newPass === data.currentPass) {
            $error.text('New password must be different from the current password').show();
            return;
        }

        // New password validation
        if (data.newPass.length < 8) {
            $error.text('New password must be at least 8 characters long').show();
            return;
        }
        // Confirm password validation
        if (data.newPass !== data.confirmPass) {
            $error.text('New password and confirmation password do not match').show();
            return;
        }

        try {
            const response = await ApiCall.call('POST', '/api/v1/user/update-password', data);
            if (response.status === 200) {
                $success.text('Password successfully saved').show();
                setTimeout(() => {
                    $success.fadeOut(150);
                }, 2000);
            } else {
                $error.text(`${response.message}`).show();
                setTimeout(() => {
                    $error.fadeOut(150);
                }, 2000);
            }
        } catch (error) {
            console.error('Error saving Password:', error);
            $error.text('An error occurred while saving the password').show();
        }
    }


    logout() {
        window.location.href = '/logout';
    }

}

const account = new Account();