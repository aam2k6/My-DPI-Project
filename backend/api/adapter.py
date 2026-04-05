
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    
    def save_user(self, request, sociallogin, form=None):
        """
        Customize user fields before saving
        Token saving is handled by signals now
        """
        user = super().save_user(request, sociallogin, form)
        
        # Your custom user logic
        if sociallogin.account.provider == 'google':
            print(f"User saved: {user.email} (login_method: {user.login_method})")
        
        return user
    
    def populate_user(self, request, sociallogin, data):
        """
        Customize user fields from OAuth data
        """
        user = super().populate_user(request, sociallogin, data)
        
        # Set custom fields from Google data
        if sociallogin.account.provider == 'google':
            extra_data = sociallogin.account.extra_data
            
            # Example: Extract additional Google data
            user.first_name = extra_data.get('given_name', '')
            user.last_name = extra_data.get('family_name', '')
            
        return user
