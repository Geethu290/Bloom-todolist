/**
 * auth.js
 * Authentication Frontend Logic for Bloom
 * Handles login, registration, validation, password visibility toggling, and jQuery AJAX calls.
 */

$(document).ready(function () {
  'use strict';

  // =========================================================================
  // 1. HELPERS & TOASTS
  // =========================================================================

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(message, type = 'info') {
    const iconMap = {
      success: '🌸',
      error: '⚠️',
      info: '✨',
    };
    const icon = iconMap[type] || '✨';

    const $toast = $(`
      <div class="toast toast-${type}" role="alert">
        <span class="toast-icon">${icon}</span>
        <span class="toast-msg">${escapeHtml(message)}</span>
      </div>
    `);

    $('#toastContainer').append($toast);

    setTimeout(function () {
      $toast.addClass('fade-out');
      setTimeout(function () {
        $toast.remove();
      }, 300);
    }, 4000);
  }

  function showAlert(message) {
    const $alert = $('#authAlert');
    $('#authAlertText').text(message);
    $alert.slideDown(200);
  }

  function hideAlert() {
    $('#authAlert').slideUp(150);
  }

  // =========================================================================
  // 2. SHOW / HIDE PASSWORD TOGGLE
  // =========================================================================

  $('.password-toggle-btn').on('click', function () {
    const targetId = $(this).data('target');
    const $input = $(`#${targetId}`);

    if ($input.length === 0) return;

    if ($input.attr('type') === 'password') {
      $input.attr('type', 'text');
      $(this).text('🙈').attr('title', 'Hide password').attr('aria-label', 'Hide password');
    } else {
      $input.attr('type', 'password');
      $(this).text('👁️').attr('title', 'Show password').attr('aria-label', 'Show password');
    }
  });

  // =========================================================================
  // 3. LOGIN FORM SUBMISSION
  // =========================================================================

  $('#loginForm').on('submit', function (e) {
    e.preventDefault();
    hideAlert();

    const email = $('#loginEmail').val().trim();
    const password = $('#loginPassword').val();
    let hasError = false;

    // Reset errors
    $('.input-error').removeClass('visible').text('');
    $('.form-control').removeClass('error');

    if (!email) {
      $('#loginEmail').addClass('error');
      $('#loginEmailError').addClass('visible').text('Please enter your email address.');
      hasError = true;
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        $('#loginEmail').addClass('error');
        $('#loginEmailError').addClass('visible').text('Please enter a valid email address.');
        hasError = true;
      }
    }

    if (!password) {
      $('#loginPassword').addClass('error');
      $('#loginPasswordError').addClass('visible').text('Please enter your password.');
      hasError = true;
    }

    if (hasError) return;

    const $btn = $('#loginSubmitBtn');
    $btn.prop('disabled', true);
    $btn.find('.btn-text').hide();
    $btn.find('.btn-spinner').show();

    $.ajax({
      url: '/api/auth/login',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ email, password }),
      dataType: 'json',
      success: function (res) {
        showToast(res.message || 'Welcome back! 🌸', 'success');
        // Redirect to dashboard
        setTimeout(function () {
          window.location.href = '/';
        }, 600);
      },
      error: function (xhr) {
        const errorMsg =
          xhr.responseJSON && xhr.responseJSON.message
            ? xhr.responseJSON.message
            : 'Could not sign in. Please verify your credentials.';
        showAlert(errorMsg);
        showToast(errorMsg, 'error');
        $btn.prop('disabled', false);
        $btn.find('.btn-spinner').hide();
        $btn.find('.btn-text').show();
      },
    });
  });

  // =========================================================================
  // 4. REGISTRATION FORM SUBMISSION
  // =========================================================================

  $('#registerForm').on('submit', function (e) {
    e.preventDefault();
    hideAlert();

    const name = $('#regName').val().trim();
    const email = $('#regEmail').val().trim();
    const password = $('#regPassword').val();
    const confirmPassword = $('#regConfirmPassword').val();
    let hasError = false;

    // Reset error labels
    $('.input-error').removeClass('visible').text('');
    $('.form-control').removeClass('error');

    if (!name || name.length < 2) {
      $('#regName').addClass('error');
      $('#regNameError').addClass('visible').text('Please enter your lovely name (at least 2 letters).');
      hasError = true;
    }

    if (!email) {
      $('#regEmail').addClass('error');
      $('#regEmailError').addClass('visible').text('Please enter your email address.');
      hasError = true;
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        $('#regEmail').addClass('error');
        $('#regEmailError').addClass('visible').text('Please provide a valid email address.');
        hasError = true;
      }
    }

    if (!password || password.length < 6) {
      $('#regPassword').addClass('error');
      $('#regPasswordError').addClass('visible').text('Password must be at least 6 characters long.');
      hasError = true;
    }

    if (password !== confirmPassword) {
      $('#regConfirmPassword').addClass('error');
      $('#regConfirmPasswordError').addClass('visible').text('Passwords do not match. Please re-enter.');
      hasError = true;
    }

    if (hasError) return;

    const $btn = $('#regSubmitBtn');
    $btn.prop('disabled', true);
    $btn.find('.btn-text').hide();
    $btn.find('.btn-spinner').show();

    $.ajax({
      url: '/api/auth/register',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ name, email, password, confirmPassword }),
      dataType: 'json',
      success: function (res) {
        showToast(res.message || 'Account created successfully! 🌸', 'success');
        // Redirect to dashboard
        setTimeout(function () {
          window.location.href = '/';
        }, 700);
      },
      error: function (xhr) {
        const errorMsg =
          xhr.responseJSON && xhr.responseJSON.message
            ? xhr.responseJSON.message
            : 'Could not create account. Please try again.';
        showAlert(errorMsg);
        showToast(errorMsg, 'error');
        $btn.prop('disabled', false);
        $btn.find('.btn-spinner').hide();
        $btn.find('.btn-text').show();
      },
    });
  });

  // Remove input errors as user types
  $('.form-control').on('input', function () {
    $(this).removeClass('error');
    $(this).closest('.form-group').find('.input-error').removeClass('visible').text('');
  });
});
