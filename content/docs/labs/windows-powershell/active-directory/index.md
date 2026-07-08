---
title: Active Directory Services & User Creation
description: A step-by-step walkthrough of installing Active Directory Domain Services (AD DS), promoting the server to a Domain Controller, and provisioning user accounts in a custom Organizational Unit (OU).
sidebar:
  label: Active Directory & Users
  order: 2
---


## Lab Objective

This lab installs AD DS on Windows Server, promotes the box to a domain controller, and creates a test OU with 10 users. Three phases:
1. **AD DS Role Installation:** Installing the binaries and management tools for Active Directory Domain Services.
2. **Domain Controller Promotion:** Configuring the forest, establishing the root domain `rajkumar.local`, and promoting the server.
3. **OU & User Provisioning:** Creating a structured Organizational Unit (`CST170`) and provisioning 10 active directory user accounts.

![Lab Overview Banner](images/assignment1.pdf-0-1.png)

---

## Phase 1: Active Directory Domain Services Role Installation

In this phase, we install the **Active Directory Domain Services (AD DS)** role and its associated remote administration tools onto the local server using the Server Manager dashboard.

### Summary of Installation Steps

| Step | Action | Description |
| :--- | :--- | :--- |
| **1** | Launch Role Wizard | Start the "Add Roles and Features" wizard from Server Manager. |
| **2** | Select Installation Type | Choose "Role-based or feature-based installation". |
| **3** | Select Target Server | Identify and select the destination server from the pool. |
| **4** | Select Server Roles | Select the "Active Directory Domain Services" role. |
| **5** | Add Features | Accept the required administrative and command-line features. |
| **6** | Review Features | Verify default features (such as Group Policy Management). |
| **7** | Review AD DS Info | Read the deployment guidelines and DNS prerequisites. |
| **8** | Confirm Selections | Configure automatic restart settings and verify changes. |
| **9** | Monitor Progress | Watch the progress bar as files are deployed. |
| **10** | Complete Installation | Verify success and close the wizard to begin promotion. |

---

### Step-by-Step Installation Walkthrough

#### Step 1: Launch the Add Roles Wizard
Open the **Server Manager** dashboard, click on **Manage** in the upper-right corner, and select **Add Roles and Features** to launch the configuration wizard.

![Step 1 - Launch Wizard](images/assignment1.pdf-1-1.png)

#### Step 2: Select the Installation Type
Choose **Role-based or feature-based installation** and click **Next** to deploy the role onto a single server instance.

![Step 2 - Installation Type](images/assignment1.pdf-2-1.png)

#### Step 3: Select the Destination Server
Select the target server from the server pool. Verify that the correct server name and local IP address are highlighted.

![Step 3 - Server Selection](images/assignment1.pdf-3-1.png)

#### Step 4: Check Active Directory Domain Services
In the list of server roles, select the checkbox for **Active Directory Domain Services**.

![Step 4 - Role Selection](images/assignment1.pdf-4-1.png)

#### Step 5: Add Required Features
A pop-up prompt will display the dependent features required for AD DS management (such as AD DS Tools, AD Administrative Center, and PowerShell modules). Click **Add Features** to proceed.

![Step 5 - Feature Confirmation](images/assignment1.pdf-5-1.png)

#### Step 6: Review Features List
Verify that the default features are selected (including Group Policy Management). Click **Next** without making additional changes.

![Step 6 - Features Review](images/assignment1.pdf-6-1.png)

#### Step 7: Read AD DS Information
Review the information screen detailing what AD DS does, noting the recommendation to set up at least two domain controllers for redundancy in production environments.

![Step 7 - AD DS Info](images/assignment1.pdf-7-1.png)

#### Step 8: Confirm Installation Selections
Verify all selected roles and features. Optionally check the option to **Restart the destination server automatically if required**, then click **Install**.

![Step 8 - Confirm Selections](images/assignment1.pdf-8-1.png)

#### Step 9: Monitor Installation Progress
Wait for the progress bar to complete. The wizard will show the status of the binary deployment.

![Step 9 - Installation Progress](images/assignment1.pdf-9-1.png)

#### Step 10: Complete Role Installation
Once the progress bar indicates **Installation succeeded**, click **Close**. Notice the warning flag in Server Manager prompting for post-deployment configuration.

![Step 10 - Installation Complete](images/assignment1.pdf-10-1.png)

---

## Phase 2: Promote the Server as a Domain Controller

Once the AD DS role files are installed, the server must be promoted to a Domain Controller to establish the new Active Directory forest.

### Summary of Promotion Steps

| Step | Configuration Window | Configuration Details |
| :--- | :--- | :--- |
| **11** | Deployment Configuration | Select "Add a new forest" and define the root domain `rajkumar.local`. |
| **12** | Domain Controller Options | Set functional levels, enable DNS/GC, and set a secure DSRM password. |
| **13** | DNS Options | Review the DNS delegation warning (safe to ignore for a new forest). |
| **14** | Additional Options | Confirm the auto-generated NetBIOS name: `RAJKUMAR`. |
| **15** | Database Paths | Define paths for the NTDS database, log files, and SYSVOL folder. |
| **16** | Review Options | Review the script and configuration parameters. |
| **17** | Prerequisites Check | Perform and pass the system readiness checks. |
| **18** | Installation & Promotion | Initiate the promotion; the server will reboot automatically. |
| **19** | Domain Sign-in | Log back in using the new domain credentials: `RAJKUMAR\Administrator`. |
| **20** | Service Verification | Open the management tools to verify active directory health. |

---

### Step-by-Step DC Promotion Walkthrough

#### Step 11: Deployment Configuration
Click the notification flag in Server Manager and select **Promote this server to a domain controller**. In the deployment configuration wizard, select **Add a new forest** and enter `rajkumar.local` as the **Root domain name**.

![Step 11 - Deployment Config](images/assignment1.pdf-11-1.png)

#### Step 12: Configure Domain Controller Options
Keep the Forest and Domain functional levels set to **Windows Server 2016** (or your current version). Ensure that **Domain Name System (DNS) server** and **Global Catalog (GC)** are checked, then specify a secure **Directory Services Restore Mode (DSRM)** password.

![Step 12 - DC Options](images/assignment1.pdf-12-1.png)

#### Step 13: DNS Options Review
The wizard will display a warning that a delegation for this DNS server cannot be created. This is expected because we are creating a new root domain with no parent infrastructure. Click **Next** to bypass.

![Step 13 - DNS Options](images/assignment1.pdf-13-1.png)

#### Step 14: NetBIOS Domain Name Verification
The wizard will automatically determine the NetBIOS domain name. Verify that it is set to **RAJKUMAR** and click **Next**.

![Step 14 - NetBIOS Name](images/assignment1.pdf-14-1.png)

#### Step 15: Database, Log, and SYSVOL Paths
Confirm the default file storage locations for the AD DS database, log files, and SYSVOL. Keep them as `C:\Windows\NTDS` and `C:\Windows\SYSVOL` for standard configurations.

![Step 15 - Folder Paths](images/assignment1.pdf-15-1.png)

#### Step 16: Review Selection Options
Review the configuration summary. You can click **View Script** to export the equivalent PowerShell script for automated installations. Click **Next** to continue.

![Step 16 - Review Selection](images/assignment1.pdf-16-1.png)

#### Step 17: Prerequisite Check Validation
The wizard will run prerequisite checks to ensure the server is ready for promotion. Once the checks pass successfully, click **Install**.

![Step 17 - Prerequisite Check](images/assignment1.pdf-17-1.png)

#### Step 18: Execute Installation
The wizard will configure the directory services, partition database, and set security configurations. The server will automatically restart upon completion.

![Step 18 - Installation](images/assignment1.pdf-18-1.png)

#### Step 19: Sign In to the Domain
After the reboot, the login screen will show the domain prefix. Enter the administrator credentials to log in as `RAJKUMAR\Administrator`.

![Step 19 - Domain Sign-In](images/assignment1.pdf-19-1.png)

#### Step 20: Verify Services
Open Server Manager and verify that **AD DS** and **DNS** services are running and showing green/healthy status indicator lights.

![Step 20 - Service Verification](images/assignment1.pdf-20-1.png)

---

## Phase 3: Create User Accounts using Active Directory Users and Computers

To organize resources and user accounts, we create a custom Organizational Unit (OU) and provision 10 user accounts within it.

### Step 21: Create the Organizational Unit (OU)
1. Open the **Active Directory Users and Computers** console from **Tools**.
2. Right-click the root domain `rajkumar.local`, select **New**, and click **Organizational Unit**.
3. Name the new OU **CST170** and click **OK**.

![Step 21 - OU Creation](images/assignment1.pdf-21-1.png)

### Step 22: Provision the 10 User Accounts
1. Inside the **CST170** OU, right-click the empty space, select **New**, and click **User**.
2. Create 10 user accounts (e.g. User1 to User10, or custom-named accounts) by entering their First Name, Last Name, and User Logon Name.
3. Define secure passwords for each account, configure logon policies (such as forcing a password change at first logon or setting passwords to never expire), and click **Finish**.

![Step 22 - User Accounts Created](images/assignment1.pdf-22-1.png)
