---
title: Basic PowerShell Administration Script
description: A basic PowerShell script using functions, loops, and a switch-case menu to automate common Active Directory tasks on Windows Server.
sidebar:
  label: AD Admin (Basic)
  order: 7
---

## Script Overview

A basic scripting exercise in PowerShell. The script covers three things: writing functions, building a switch/case menu loop, and calling core AD cmdlets (`New-ADUser`, `New-ADGroup`, `Install-WindowsFeature`).

The menu gives an admin three options:
1. Create a user account in AD
2. Create a security group
3. Install a Windows Server role or feature

---

## Script

A `switch` statement inside a `do-while` loop drives the menu. Each option calls its own function.

```powershell
# directory_admin_basic.ps1
# Interactive administration script for AD DS Users, Groups, and Server Roles

function Create-User {
    param(
        [string]$Username,
        [string]$Password
    )
    # Convert password to secure string and create AD User
    $SecurePassword = ConvertTo-SecureString $Password -AsPlainText -Force
    New-ADUser -Name $Username -AccountPassword $SecurePassword -Enabled $true
    Write-Host "User '$Username' created successfully." -ForegroundColor Green
}

function Create-Group {
    param(
        [string]$GroupName
    )
    # Create a Global Security Group in Active Directory
    New-ADGroup -Name $GroupName -GroupScope Global -GroupCategory Security
    Write-Host "Group '$GroupName' created successfully." -ForegroundColor Green
}

function Add-ServerRole {
    param(
        [string]$Role
    )
    # Install the requested Windows Feature with Management Tools
    Install-WindowsFeature -Name $Role -IncludeManagementTools
    Write-Host "Server role '$Role' installed successfully." -ForegroundColor Green
}

# Main Menu Loop
do {
    Write-Host "`n==================================" -ForegroundColor Cyan
    Write-Host "    Select an Administrative Task"
    Write-Host "==================================" -ForegroundColor Cyan
    Write-Host "1. Create a User"
    Write-Host "2. Create a Group"
    Write-Host "3. Add Server Role"
    Write-Host "4. Exit"
    Write-Host "----------------------------------" -ForegroundColor Cyan
    
    $choice = Read-Host "Enter your choice (1-4)"
    
    switch ($choice) {
        1 {
            $Username = Read-Host "Enter the username"
            $Password = Read-Host "Enter the password"
            Create-User -Username $Username -Password $Password
        }
        2 {
            $GroupName = Read-Host "Enter the group name"
            Create-Group -GroupName $GroupName
        }
        3 {
            $Role = Read-Host "Enter the server role (e.g., AD-Domain-Services)"
            Add-ServerRole -Role $Role
        }
        4 {
            Write-Host "Exiting script..." -ForegroundColor Yellow
            break
        }
        default {
            Write-Host "Invalid choice, please try again." -ForegroundColor Red
        }
    }
} while ($choice -ne 4)
```

---

## Execution

Run the script in an elevated PowerShell session on the Domain Controller. The menu prints in the console — enter the number for the task you want.

Option 1 asks for a username and password, then creates the account. Option 2 asks for a group name and creates it. Option 3 takes a feature name like `AD-Domain-Services` and installs it.

Option 4 exits.

> Needs the `ActiveDirectory` module installed and an elevated session (`Run as Administrator`).
