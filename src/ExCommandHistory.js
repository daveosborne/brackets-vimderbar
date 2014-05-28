/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, localStorage, $, brackets */

// holds vim ex commmand history in projectFile
define(function (require, exports) {
    var ProjectManager = brackets.getModule("project/ProjectManager"), 
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        vimderbarPrefs = PreferencesManager.getExtensionPrefs("vimderbar"),
        commandHistory,
        historyPosition,
        currentProject,
        useCommonVimHistory;
    
    // Housekeeping
    /**
     * Clear commandHistory.
     */
    function resetHistory() {
        commandHistory = [];
        historyPosition = -1;
        _persistHistory();
    }
    /**
     * @private
     * Switch history to another project.
     * @param {String} project Project full path, used as lookup key in localStorage.
     */
    function _changeProject(project) {
        if (useCommonVimHistory) {
            currentProject = "common";
        } else {
            currentProject = project;
        }
        _fetchHistory();
    }
    // Persistence
    /**
     * @private
     * Store current history in localStorage.
     */
    function _persistHistory() {
        localStorage.setItem("fontface.vimderbar.history." + currentProject, JSON.stringify(commandHistory));
    }
    /**
     * @private
     * Retrieve current history from localStorage.
     */
    function _fetchHistory() {
        historyPosition = -1;
        var history = localStorage.getItem("fontface.vimderbar.history." + currentProject);
        if (history) {
            try {
                commandHistory = JSON.parse(history);
            } catch (e) {
                console.error("vimderbar: history parse error", e);
                commandHistory = [];
            }
        } else {
            resetHistory();
        }
    }
    // Status Bar Interaction
    /**
     * Add an ExCommand to history (prepend), reset history position, store history.
     * @param {String} command ExCommand string to store in history.
     */
    function add(command) {
        var index = $.inArray(command, commandHistory);
        if (index >= 0) {
            commandHistory.splice(index, 1);
        }
        commandHistory.unshift(command);
        historyPosition = -1;
        _persistHistory();
    }
    /**
     * Get the previous ExCommand in history, move position index.
     * @returns {String} ExCommand at new history position.
     */
    function getPrevHistoryItem() {
        historyPosition++;
        if (historyPosition >= commandHistory.length) {
            historyPosition = commandHistory.length - 1;
        }
        return commandHistory[historyPosition];
    }
    /**
     * Get the next ExCommand in history, move position index.
     * @returns {String} ExCommand at new history position.
     */
    function getNextHistoryItem() {
        historyPosition--;
        if (historyPosition < 0) {
            historyPosition = 0;
        }
        return commandHistory[historyPosition];
    }
    /**
     * Reset history position (triggered on input area blur)
     */
    function exitHistory() {
        historyPosition = -1;
    }
    
    /**
     * Get history preferences and change project history to current project.
     */
    function init() {
        useCommonVimHistory = vimderbarPrefs.get("commonHistory");
        _changeProject(ProjectManager.getProjectRoot().fullPath);
        
        $(ProjectManager).on("projectOpen", function () {
            _changeProject(ProjectManager.getProjectRoot().fullPath);
        });
        vimderbarPrefs.on("change", function () {
            useCommonVimHistory = vimderbarPrefs.get("commonHistory");
            _changeProject(ProjectManager.getProjectRoot().fullPath);
        });
    }

    exports.init = init;
    exports.add = add;
    exports.getPrevHistoryItem = getPrevHistoryItem;
    exports.getNextHistoryItem = getNextHistoryItem;
    exports.resetHistory = resetHistory;
    exports.exitHistory = exitHistory;
});
