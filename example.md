# Jira Cards - Bevy Editor & Launcher



## Epic: Launcher Core Functionality (LAUNCH-001)



### LAUNCH-101: Project Management System

**Type**: Story  

**Priority**: Critical  

**Story Points**: 8  

**Sprint**: 1-2  



**Description**: As a developer, I want to manage my Bevy projects through the launcher so that I can easily create, import, and organize my game projects.



**Acceptance Criteria**:

- [ ] Can create new projects with configurable settings

- [ ] Can import existing Bevy projects by folder selection

- [ ] Projects display with thumbnails in a grid/list view

- [ ] Can search projects by name, tags, or last modified date

- [ ] Project metadata persists between launcher sessions

- [ ] Can mark projects as favorites

- [ ] Can delete projects (with confirmation)



**Technical Tasks**:

- [ ] Design project metadata schema

- [ ] Implement SQLite database for project storage

- [ ] Create thumbnail generation service

- [ ] Build project scanning service

- [ ] Implement search indexing



**Dependencies**: None  

**Blocks**: LAUNCH-201, LAUNCH-301



---



### LAUNCH-102: Editor Version Management

**Type**: Story  

**Priority**: Critical  

**Story Points**: 5  

**Sprint**: 1-2  



**Description**: As a developer, I want to manage multiple Bevy Editor versions so that I can use different versions for different projects.



**Acceptance Criteria**:

- [ ] Can view available editor versions from remote manifest

- [ ] Can download and install editor versions with progress indicator

- [ ] Can associate specific editor version with each project

- [ ] Version compatibility warnings shown for mismatched versions

- [ ] Can uninstall unused editor versions

- [ ] Disk space usage shown per version



**Technical Tasks**:

- [ ] Create version manifest API client

- [ ] Implement download manager with pause/resume

- [ ] Build version isolation system

- [ ] Create compatibility checker service



**Dependencies**: None  

**Blocks**: LAUNCH-103



---
