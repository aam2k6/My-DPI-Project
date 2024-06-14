IUDX-DATA TRUSTS

This Django-based web application includes various endpoints to create, retrieve, update, and delete resources and lockers. It also includes endpoints to view specific pages within the application.

api/: Contains the Django app responsible for the API.

admin.py: Configuration for the Django admin interface for the API models.

apps.py: Configuration for the API application.

models.py: Defines the database models for the DPI primitives.

serializers.py: Serializers to convert model instances to JSON and vice versa.

tests.py: Unit tests for the API endpoints.

urls.py: URL routes for the API endpoints.

views.py: Contains the logic for handling API requests.

mysite/: Contains the settings and configuration for the Django project.

urls.py: URL routes for the main project.

static/: Directory for static files (CSS, JavaScript, images).

templates/: Directory for HTML templates.

db.sqlite3: SQLite database file.

manage.py: Command-line utility for managing the Django project.

API Endpoints
GET /api/primitives/: Retrieve a list of all DPI primitives.

POST /api/primitives/: Create a new DPI primitive.

GET /api/primitives/{id}/: Retrieve a specific DPI primitive by its ID.

PUT /api/primitives/{id}/: Update a specific DPI primitive by its ID.

DELETE /api/primitives/{id}/: Delete a specific DPI primitive by its ID.


How to Run the Project
Prerequisites
•	Python 3.x

•	Django

•	SQLite (or another database, if configured)

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



