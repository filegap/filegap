use assert_cmd::Command;

#[test]
fn support_command_prints_discreet_support_message() {
    Command::cargo_bin("filegap")
        .expect("binary should build")
        .arg("support")
        .assert()
        .success()
        .stdout(predicates::str::contains("Support Filegap"))
        .stdout(predicates::str::contains("Open source, privacy-first PDF tools that run locally."))
        .stdout(predicates::str::contains("https://buymeacoffee.com/filegap"));
}
