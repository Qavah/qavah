//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./Qavah.sol";

contract Contract is Initializable {
    address public usdTokenAddress;
    string public siteUrl;
    uint256 public root;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(
        address _usdTokenAddress,
        string calldata _siteUrl,
        uint256 _root
    ) public initializer {
        usdTokenAddress = _usdTokenAddress;
        siteUrl = _siteUrl;
        root = _root;
    }

    struct Project {
        bytes32 id;
        address creator;
        string title;
        uint256 requestedAmount;
        string description;
        string image;
        uint256 fundedAmount;
        uint256 claimedAmount;
        address[] donators;
        uint256 createdAt;
        Qavah qavah;
    }
    mapping(bytes32 => Project) projects;
    bytes32[] projectIds;
    uint256 public qavahsCount;

    event ProjectCreated(bytes32 id, address indexed from);
    event FundsDonated(bytes32 indexed id, address from);
    event FundsClaimed(bytes32 indexed id, address from);
    event ProjectEdited(bytes32 indexed id, address from);
    event UserReported(address indexed userAddress, address by, string reason);

    struct User {
        bytes32[] projectIds;
        address[] reportedBy;
    }
    mapping(address => User) users;

    function getProjects() public view returns (Project[] memory) {
        Project[] memory _projects = new Project[](projectIds.length);
        for (uint256 i = 0; i < projectIds.length; i++) {
            _projects[i] = projects[projectIds[i]];
        }
        return _projects;
    }

    function getProject(bytes32 id) public view returns (Project memory) {
        return projects[id];
    }

    function getProjectsByUser(address userAddress)
        public
        view
        returns (Project[] memory)
    {
        bytes32[] memory projectIdsByUser = users[userAddress].projectIds;
        Project[] memory _projects = new Project[](projectIdsByUser.length);
        for (uint256 i = 0; i < projectIdsByUser.length; i++) {
            _projects[i] = projects[projectIdsByUser[i]];
        }
        return _projects;
    }

    function createProject(
        string calldata title,
        string calldata description,
        uint256 requestedAmount,
        string calldata image
    ) public {
        require(bytes(title).length > 0, "Project title must not be empty.");
        require(
            requestedAmount / 1e18 >= 10,
            "Requested amount be at least 10 USD."
        );
        bytes32 id = keccak256(
            abi.encodePacked(block.timestamp, projectIds.length)
        );
        require(bytes(projects[id].title).length == 0, "Internal error.");

        Project memory project;
        project.id = id;
        project.creator = msg.sender;
        project.title = title;
        project.description = description;
        project.requestedAmount = requestedAmount;
        project.image = image;
        project.createdAt = block.timestamp;
        project.qavah = new Qavah();

        projects[id] = project;
        projectIds.push(id);

        users[msg.sender].projectIds.push(id);

        emit ProjectCreated(id, msg.sender);
    }

    function editProject(
        bytes32 id,
        string calldata title,
        string calldata description,
        string calldata image
    ) public {
        Project storage project = projects[id];
        require(
            msg.sender == project.creator,
            "Only project creator can edit the project."
        );
        require(bytes(title).length > 0, "Project title must not be empty.");

        project.title = title;
        project.description = description;
        project.image = image;

        emit ProjectEdited(id, msg.sender);
    }

    function donateToProject(
        bytes32 id,
        uint256 amount,
        string calldata message
    ) public {
        Project storage project = projects[id];
        require(
            project.fundedAmount < project.requestedAmount,
            "Campaign is closed."
        );
        require(
            msg.sender != project.creator,
            "You cannot donate to yourself."
        );
        require(
            IERC20(usdTokenAddress).transferFrom(
                msg.sender,
                address(this),
                amount
            ),
            "Transfer failed."
        );
        uint256 donationPercentage = (root**2 * amount) /
            project.requestedAmount;
        require(donationPercentage > 0, "Amount too low.");
        uint256 fundedPercentage = (project.fundedAmount * root**2) /
            project.requestedAmount;
        uint256 donationAmount = (donationPercentage *
            project.requestedAmount) / root**2;
        project.fundedAmount += donationAmount;
        project.donators.push(msg.sender);

        users[msg.sender].projectIds.push(id);

        mintQavah(
            project,
            donationPercentage,
            donationAmount,
            fundedPercentage,
            message
        );

        emit FundsDonated(id, msg.sender);
    }

    function claimProjectFunds(bytes32 id) public {
        Project storage project = projects[id];
        require(
            msg.sender == project.creator,
            "Only project creator can claim the funds."
        );
        uint256 transferAmount = project.fundedAmount - project.claimedAmount;
        require(transferAmount > 0, "There is nothing to claim.");

        require(
            IERC20(usdTokenAddress).transfer(msg.sender, transferAmount),
            "Transfer failed."
        );
        project.claimedAmount += transferAmount;

        emit FundsClaimed(id, msg.sender);
    }

    function reportUser(address userAddress, string calldata reason) public {
        User storage user = users[userAddress];
        require(user.projectIds.length > 0, "User does not exist.");
        require(userAddress != msg.sender, "You cannot report yourself.");
        for (uint256 i = 0; i < user.reportedBy.length; i++) {
            if (msg.sender == user.reportedBy[i]) {
                revert("You have already reported this user.");
            }
        }
        user.reportedBy.push(msg.sender);
        emit UserReported(userAddress, msg.sender, reason);
    }

    function shuffleArray(bytes[] memory array, uint256 entropy) private pure {
        for (uint256 i = array.length - 1; i > 0; i--) {
            uint256 swapIndex = entropy % (array.length - i);
            bytes memory currentIndex = array[i];
            bytes memory indexToSwap = array[swapIndex];
            array[i] = indexToSwap;
            array[swapIndex] = currentIndex;
        }
    }

    function getTiles() private view returns (bytes[] memory) {
        bytes[] memory tiles = new bytes[](root**2);
        for (uint256 y = 0; y < root; y++) {
            for (uint256 x = 0; x < root; x++) {
                tiles[y * root + x] = abi.encodePacked(
                    "<use href='%23a' clip-path='inset(",
                    Strings.toString((y * 100) / root),
                    "% ",
                    Strings.toString(((root - x - 1) * 100) / root),
                    "% ",
                    Strings.toString(((root - y - 1) * 100) / root),
                    "% ",
                    Strings.toString((x * 100) / root),
                    "%)'/>"
                );
            }
        }
        return tiles;
    }

    function getTilesBytes(bytes32 projectId)
        private
        view
        returns (bytes memory)
    {
        bytes[] memory tiles = getTiles();

        shuffleArray(tiles, uint256(projectId));

        bytes[] memory tilesChunks = new bytes[](tiles.length / 5);
        for (uint256 i = 0; i < tiles.length; i += 5) {
            tilesChunks[i / 5] = abi.encodePacked(
                tiles[i],
                tiles[i + 1],
                tiles[i + 2],
                tiles[i + 3],
                tiles[i + 4]
            );
        }
        bytes memory tilesBytes;
        for (uint256 i = 0; i < tilesChunks.length / 5; i++) {
            tilesBytes = abi.encodePacked(
                tilesBytes,
                tilesChunks[i * 5],
                tilesChunks[i * 5 + 1],
                tilesChunks[i * 5 + 2],
                tilesChunks[i * 5 + 3],
                tilesChunks[i * 5 + 4]
            );
        }
        return tilesBytes;
    }

    function getSvgStart(
        string memory projectImage,
        uint256 donationPercentage,
        uint256 fundedPercentage
    ) private view returns (bytes memory) {
        return
            abi.encodePacked(
                "<svg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'><defs><style>@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700');*{color:%23611f69}text,span{font-size:10px;font-family:'Space Grotesk',sans-serif;fill:currentColor}use{opacity:0.2}use:nth-of-type(n+",
                Strings.toString(fundedPercentage + 1),
                "):nth-of-type(-n+",
                Strings.toString(fundedPercentage + donationPercentage),
                "){opacity:1}</style><image id='a' href='",
                projectImage,
                "' x='40' y='64' width='320' height='180'/></defs><rect x='40' y='40' width='320' height='24' fill='%23fbcc5c'/><rect x='40' y='244' width='320' height='116' fill='%23fbcc5c'/><rect x='39' y='39' width='322' height='322' rx='0' fill='none' stroke='currentColor' stroke-width='2'/><text style='font-weight:bold' x='50%' y='53' dominant-baseline='middle' text-anchor='middle'>qavah %23",
                Strings.toString(qavahsCount),
                "</text>"
            );
    }

    function getSvgEnd(
        string memory projectTitle,
        uint256 donationPercentage,
        string calldata message
    ) private pure returns (bytes memory) {
        return
            abi.encodePacked(
                "<foreignObject x='60' y='260' width='280' height='36'><span xmlns='http://www.w3.org/1999/xhtml' style='font-size:14px;font-weight:bold;text-overflow:ellipsis'>",
                projectTitle,
                "</span></foreignObject><foreignObject x='60' y='304' width='240' height='40' style='line-height: 0.8'><span xmlns='http://www.w3.org/1999/xhtml'>%E2%80%94 ",
                message,
                "</span></foreignObject><text x='330' y='344' style='font-weight:bold' text-anchor='end'>",
                Strings.toString(donationPercentage),
                "</text><path transform='translate(332,334)' d='M11.3 7v-.8L9.2 4.5v-.3l1.3-.4.2-.8L9 1.3l-.8.2-.4 1.2-.3.1L5.8.7h-.9L3.5 2.2l.2.6 1.2.4.3.7-1.3 1.3-.7-.3-.4-1.2-.6-.2L.7 4.9v.9l2.1 1.7v.3l-1.3.4-.2.8L3 10.7l.8-.2.4-1.2.3-.1 1.7 2.1h.9l1.4-1.5-.2-.6-1.2-.4-.3-.7 1.3-1.3.7.3.4 1.2.6.2 1.5-1.4Z' fill='none' stroke='currentColor'/></svg>"
            );
    }

    function getAmountString(uint256 amount)
        private
        pure
        returns (bytes memory)
    {
        return
            abi.encodePacked(
                Strings.toString(amount / 1e18),
                ".",
                Strings.toString(((amount * 100) / 1e18) % 100)
            );
    }

    function getSvg(
        Project memory project,
        uint256 donationPercentage,
        uint256 fundedPercentage,
        string calldata message
    ) private view returns (bytes memory) {
        return
            abi.encodePacked(
                getSvgStart(
                    project.image,
                    donationPercentage,
                    fundedPercentage
                ),
                getTilesBytes(project.id),
                getSvgEnd(project.title, donationPercentage, message)
            );
    }

    function getDataURI(
        bytes memory svg,
        bytes32 projectId,
        uint256 donationAmount,
        string calldata message,
        uint256 donationPercentage
    ) private view returns (bytes memory) {
        return
            abi.encodePacked(
                '{"name":"Qavah #',
                Strings.toString(qavahsCount),
                '","description":"',
                abi.encodePacked(
                    siteUrl,
                    Strings.toHexString(uint256(projectId))
                ),
                '","image":"data:image/svg+xml;utf8,',
                svg,
                '","amount":',
                getAmountString(donationAmount),
                ',"message":"',
                message,
                '","percent":',
                Strings.toString(donationPercentage),
                ',"timestamp":',
                Strings.toString(block.timestamp),
                "}"
            );
    }

    function mintQavah(
        Project memory project,
        uint256 donationPercentage,
        uint256 donationAmount,
        uint256 fundedPercentage,
        string calldata message
    ) private {
        qavahsCount++;
        bytes memory svg = getSvg(
            project,
            donationPercentage,
            fundedPercentage,
            message
        );
        bytes memory dataURI = getDataURI(
            svg,
            project.id,
            donationAmount,
            message,
            donationPercentage
        );
        project.qavah.safeMint(
            msg.sender,
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(dataURI)
                )
            )
        );
    }
}
