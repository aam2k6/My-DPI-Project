# IUDX- POLICY BASED CONSENT SERVICE ARCHITECTURE

API Documentation link:
https://app.swaggerhub.com/apis/CHITNISKANIKA/Locker/1.0.0#/

Managing data sharing in compliance with regulations and obtaining consent from data owners can be complex.  To address this, we are developing a web application specifically designed to streamline the consent management process, ensuring that data sharing is both open-ended and compliant.​

## Prerequisites
•	Python 3.x
•	Django 5.0.6
•	Django REST framework
•	Django REST framework authtoken
•	SQLite (or another database, if configured)
•	Node.js and npm (for the frontend)

Steps to Run

1.	Clone the repository (if applicable) or extract the provided zip file.
2.	Navigate to the project directory:
            cd /path/to/DPI-Primitive-api-test
            cd/mysite
3.	Install dependencies: 
  	        pip install -r requirements.txt
4.	Apply migrations to set up the database:
             python manage.py migrate
5.	Run the development server:
             python manage.py runserver
6.	Access the API:
1.	GET /: ("", views.display_home, name="page1")

  	Description: Displays the home page of the application
  	
  	Functionality: This endpoint serves the home page, providing an entry point to the application.
2.	GET /sharingpage(page2): ("sharingpage(page2)/", views.sharing_page, name="sharing-page")

  	Description: Displays the sharing page.
  	
  	Functionality: This endpoint serves the sharing page, where users can share resources.
3.	GET /page3/: ("page3/", views.dpi_directory, name="dpi-directory")

  	Description: Displays the DPI directory.
  	
  	Functionality: This endpoint serves the DPI directory page, listing available DPI primitives.
4.	GET /page4/: ("page4/", views.iiitb_locker, name='iiitb-locker')

  	Description: Displays the IIITB locker page.
  	
  	Functionality: This endpoint serves the IIITB locker page, providing access to locker resources.
5.	POST /addlocker/: ("addlocker/", views.LockerListCreate.as_view(), name="resource-view-create")

  	Description: Adds a new locker.
  	
  	Functionality: This endpoint allows users to create a new locker by sending a JSON object with the locker details. It saves the locker to the database and 
            returns the newly created locker with its assigned ID.
6.	POST /addresource/: ("addresource/", views.ResourceListCreate.as_view(), name="resource-view-create")

  	Description: Adds a new resource.
  	
  	Functionality: This endpoint allows users to create a new resource by sending a JSON object with the resource details. It saves the resource to the database and 
            returns the newly created resource with its assigned ID.
7.	POST /shareresource/: ("shareresource/", views.ShareResources.as_view(), name='upload-resources')

  	Description: Shares a resource.
  	
  	Functionality: This endpoint allows users to share a resource by sending a JSON object with the resource details. It saves the shared resource to the database 
            and returns the shared resource with its assigned ID.


   
How to Access the Endpoints
•	Home Page: Access it by navigating to the root URL /.

•	Sharing Page: Access it by navigating to /sharingpage(page2)/.

•	DPI Directory: Access it by navigating to /page3/.

•	IIITB Locker: Access it by navigating to /page4/.

•	Add Locker: Create a new locker by sending a POST request to /addlocker/ with the necessary locker details.

•	Add Resource: Create a new resource by sending a POST request to /addresource/ with the necessary resource details.

•	Share Resource: Share a resource by sending a POST request to /shareresource/ with the necessary resource details.



